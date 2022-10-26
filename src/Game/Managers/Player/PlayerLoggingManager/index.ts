import Player from "../../../Objects/Player";
import MainScene from "../../../Scenes/MainScene"
import { Database, RunResult } from "sqlite3";
import LoggingManager, { LoggingCategory } from "../../World/LoggingManager";
import { DefaultVitals } from "../PlayerVitalsManager";
import { DefaultStatistics } from "../PlayerStatisticsManager";
export default class PlayerLoggingManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, player : Player) {
        super(scene, "PlayerLoggingManager")
        scene.add.existing(this)
        this.player = player
        this.database = scene.loggingManager.database
        scene.loggingManager.on(LoggingManager.REQUEST_LOGGING, this.handleLogging.bind(this))
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
        const stmt = this.database.prepare(`INSERT INTO "${category}"("ID","PlayerID","Value") VALUES (NULL,?,?);`)
        stmt.run([this.databaseID, value])
    }

    private insertPlayer() {
        var self = this;
        const stmt = this.database.prepare(`INSERT INTO "Players"("ID","GotchiID") VALUES (NULL,?);`)
        stmt.run(this.player.playerSchema.gotchiID, function (err) {  
            self.databaseID = this.lastID
        });
    }

    private database : Database
    private player : Player
    private databaseID : number
}

