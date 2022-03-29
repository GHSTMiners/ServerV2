import MainScene from "../../../Scenes/MainScene";

export default class PlayerStatisticsManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene) {
        super(scene, "PlayerStatisticsManager")
    }

    public addAmount( stat : DefaultStatistics, amount : number) {
        this.statistics.get
    }

    private statistics : Map<DefaultStatistics, number> 
}

export enum DefaultStatistics {
    PLAYTIME = "Playtime",
    BLOCKS_MINED = "Blocks mined",
    ENDGAME_CRYPTO = "Endgame crypto",
    DAMAGE_TAKEN = "Damage take",
    DAMAGE_DEALT = "Damage dealt",
    AMOUNT_SPENT_EXPLOSIVES = "Amount spent on explosives",
    AMOUNT_SPENT_UPGRADE = "Amount spent on upgrades",
    TRAVELED_DISTANCE = "Traveled distance",
    FUEL_CONSUMED = "Fuel consumed",
    TOTAL_CRYPTO = "Total crypto"
}