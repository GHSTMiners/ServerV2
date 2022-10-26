import { Database } from "sqlite3"
import MainScene from "../../../Scenes/MainScene"
import * as tmp from "tmp"
export default class LoggingManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene) {
        super(scene, "PlayerLoggingManager")
        scene.add.existing(this)
        this.file = tmp.fileSync({

        }).name
        this.database = new Database(this.file)
        this.database.run(`CREATE TABLE "Players" ("ID"	INTEGER, "GotchiID"	INTEGER UNIQUE, PRIMARY KEY("ID" AUTOINCREMENT));`)
        this.createTables()
        this.createPlayersTable()
        console.log(this.file)
        scene.time.addEvent({
            delay: 5000,
            loop: true,
            callback: this.requestLogging,
            callbackScope: this
        })
    }

    private requestLogging() {
        this.emit(LoggingManager.REQUEST_LOGGING)
    }

    private createPlayersTable() {
        this.database.run(`CREATE TABLE "Playrs" (
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
                "Value"	INTEGER,
                PRIMARY KEY("ID" AUTOINCREMENT),
                FOREIGN KEY("PlayerID") REFERENCES "Players"("ID")
            );`)
        }
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