import Player from "../../../Objects/Player";
import MainScene from "../../../Scenes/MainScene"
import { Database, RunResult } from "sqlite3";
import LoggingManager, { LoggingCategory, LoggingEvent } from "../../World/LoggingManager";
import { DefaultVitals } from "../PlayerVitalsManager";
import { DefaultStatistics } from "../PlayerStatisticsManager";
import PlayerRespawnManager from "../PlayerRespawnManager";
export default class PlayerLoggingManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, player : Player) {
        super(scene, "PlayerLoggingManager")
        scene.add.existing(this)
        this.player = player
        this.database = scene.loggingManager.database
        scene.loggingManager.on(LoggingManager.REQUEST_LOGGING, this.handleLogging.bind(this))
        player.respawnManager().on(PlayerRespawnManager.DIED, () => this.logEvent(LoggingEvent.Death));
        this.insertPlayer()
    }

    private handleLogging() {
        this.insertValue(LoggingCategory.Depth, this.player.y)
        this.insertValue(LoggingCategory.Fuel, this.player.vitalsManager().get(DefaultVitals.FUEL).currentValue())
        this.insertValue(LoggingCategory.Cargo, this.player.vitalsManager().get(DefaultVitals.CARGO).currentValue())
        this.insertValue(LoggingCategory.Health, this.player.vitalsManager().get(DefaultVitals.HEALTH).currentValue())
        this.insertValue(LoggingCategory.Crypto, this.player.statisticsManager().get(DefaultStatistics.ENDGAME_CRYPTO))
    }


    private insertValue(category : LoggingCategory, value : number) {
        const stmt = this.database.prepare(`INSERT INTO "${category}"("ID","PlayerID","Time","Value") VALUES (NULL,?,?,?);`)
        stmt.run([this.databaseID, Date.now(), value])
    }

    private logEvent(event : LoggingEvent) {
        const stmt = this.database.prepare(`INSERT INTO "Events"("ID","PlayerID","Time","Event") VALUES (NULL,?,?,?);`)
        stmt.run([this.databaseID, Date.now(), event])
    }

    private insertPlayer() {
        var self = this;
        const stmt = this.database.prepare(`INSERT INTO "Players"("ID","GotchiID") VALUES (NULL,?);`)
        stmt.run(this.player.playerSchema.gotchiID, function (err) {  
            self.databaseID = this.lastID
        });
    }
    private databaseID : number
    private database : Database
    private player : Player

}

