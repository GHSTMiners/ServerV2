import MainScene from "../../../Scenes/MainScene";

export default class PlayerStatisticsManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene) {
        super(scene, "PlayerStatisticsManager")
        this.statistics = new Map<DefaultStatistics, number>()
    }

    public addAmount( stat : DefaultStatistics, amount : number = 1) {
        let statistic : number | undefined = this.statistics.get(stat)
        if(statistic) this.statistics.set(stat, amount + statistic)
        else this.statistics.set(stat, amount)
    }

    public get(stat: DefaultStatistics) : number{
        let statistic : number | undefined = this.statistics.get(stat)
        return statistic ? statistic : 0 
    }

    private statistics : Map<DefaultStatistics, number> 
}

export enum DefaultStatistics {
    PLAYTIME = "Playtime",
    BLOCKS_MINED = "Blocks mined",
    ENDGAME_CRYPTO = "Endgame crypto",
    DAMAGE_TAKEN = "Damage taken",
    DAMAGE_DEALT = "Damage dealt",
    DEATHS = "Deaths",
    AMOUNT_SPENT_EXPLOSIVES = "Amount spent on explosives",
    AMOUNT_SPENT_UPGRADE = "Amount spent on upgrades",
    TRAVELED_DISTANCE = "Traveled distance",
    FUEL_CONSUMED = "Fuel consumed",
    TOTAL_CRYPTO_MINED = "Total crypto"
}