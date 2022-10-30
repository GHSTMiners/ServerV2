import { Database } from "sqlite3"
import MainScene from "../../../Scenes/MainScene"
import * as tmp from "tmp"
import PlayTimeManager from "../PlayTimeManager"
export default class LoggingManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene) {
        super(scene, "PlayerLoggingManager")
        scene.add.existing(this)
        this.file = tmp.fileSync({

        }).name
        this.database = new Database(this.file)
        this.createPlayersTable()
        this.createTables()
        console.log(this.file)
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
        this.emit(LoggingManager.REQUEST_LOGGING)
    }

    private logEvent(event : LoggingEvent) {
        const stmt = this.database.prepare(`INSERT INTO "Events "("ID","PlayerID","Time","Event") VALUES (NULL,NULL,?,?);`)
        stmt.run([Date.now(), event])
    }

    private createPlayersTable() {
        this.database.run(`CREATE TABLE "Players" (
            "ID"	INTEGER,
            "GotchiID"	INTEGER UNIQUE,
            PRIMARY KEY("ID" AUTOINCREMENT)
        );`)
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

    private file : string
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