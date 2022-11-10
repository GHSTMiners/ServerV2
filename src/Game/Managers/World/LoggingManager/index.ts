import { Database } from "sqlite3"
import MainScene from "../../../Scenes/MainScene"
import * as tmp from "tmp"
import needle from "needle"
import PlayTimeManager from "../PlayTimeManager"
import Config from "../../../../Config"
import * as fs from 'node:fs';

export default class LoggingManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene) {
        super(scene, "PlayerLoggingManager")
        this.databaseOpen = false
        scene.add.existing(this)
        this.mainScene = scene
        this.uploaded = false
        this.file = tmp.fileSync({
        })
        console.log(this.file.name);
        
        this.database = new Database(this.file.name, (err) => {
            if(!err) this.databaseOpen = true
            else console.warn(err.message)
        })
        this.createPlayersTable()
        this.createTables()
        scene.time.addEvent({
            delay: 5000,
            loop: true,
            callback: this.requestLogging,
            callbackScope: this
        })
        scene.playTimeManager.on(PlayTimeManager.GAME_STARTED, () => this.logEvent(LoggingEvent.Game_Started))
        scene.playTimeManager.on(PlayTimeManager.GAME_ENDED, () => this.logEvent(LoggingEvent.Game_Ended))
    }

    private requestLogging() {
        if(!this.databaseOpen) return
        this.emit(LoggingManager.REQUEST_LOGGING)
    }

    private logEvent(event : LoggingEvent) {
        if(!this.databaseOpen) return
        const stmt = this.database.prepare(`INSERT INTO "Events"("ID","PlayerID","Time","Event") VALUES (NULL,NULL,?,?);`)
        stmt.run([Date.now(), event])
        stmt.finalize()
    }

    private createPlayersTable() {
        this.database.run(`CREATE TABLE "Players" (
            "ID"	INTEGER,
            "GotchiID"	INTEGER UNIQUE,
            PRIMARY KEY("ID" AUTOINCREMENT)
        );`)
    }

    public async upload() : Promise<boolean> {
        if(this.uploaded) return true
        this.databaseOpen  =false
        this.database.close()

        // Prepare data
        let formData = new FormData();
        formData.append('log_file', new Blob([fs.readFileSync(this.file.name)]), "logfile");
        formData.append('room_id', this.mainScene.room.roomId);

        //Send data to chisel
        return needle('post', `${Config.apiURL}/game/add_log_entry`, {
            room_id: this.mainScene.room.roomId,
            log_file: {
                file: this.file.name,
                content_type: 'application/x-sqlite3'
            }
        }, {
            headers: {
                'X-API-KEY': Config.apiKey,
            },
            multipart: true
        }). then(response => {
            this.uploaded = response.statusCode == 200
            return (response.statusCode == 200)
        }).catch(error => {
            console.log(`RoomID: ${this.mainScene.room.roomId}`)
            console.log(error);
            return false;
        }).finally(() =>{
            fs.unlinkSync(this.file.name)
        })
    }

    private createTables() {
        for (const category in LoggingCategory) {
            this.database.run(`CREATE TABLE "${category}" (
                "ID"	INTEGER,
                "PlayerID"	INTEGER,
                "Time" INTEGER,
                "Value"	INTEGER,
                PRIMARY KEY("ID" AUTOINCREMENT),
                FOREIGN KEY("PlayerID") REFERENCES "Players"("ID")
            );`)
        }
        this.database.run(`CREATE TABLE "Events" (
            "ID"	INTEGER,
            "PlayerID"	INTEGER,
            "Time" INTEGER,
            "Event"	STRING,
            PRIMARY KEY("ID" AUTOINCREMENT),
            FOREIGN KEY("PlayerID") REFERENCES "Players"("ID")
        )`)
    }

    private databaseOpen : boolean
    private file : tmp.FileResult
    public uploaded : boolean
    private mainScene : MainScene
    public readonly database : Database
    static readonly REQUEST_LOGGING: unique symbol = Symbol();

}

export enum LoggingCategory {
    Fuel = "Fuel",
    Cargo = "Cargo",
    Depth = "Depth",
    Health = "Health",
    Crypto = "Crypto"
}

export enum LoggingEvent {
    Game_Started = "GameStart",
    Death = "Death",
    Game_Ended = "GameEnd",
}