import Player from "../../../Objects/Player";
import MainScene from "../../../Scenes/MainScene";
import axios from "axios"
import Config from "../../../../Config";

export default class PlayerStatisticsManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player: Player) {
        super(scene, "PlayerStatisticsManager")
        this.player = player
        this.statistics = new Map<DefaultStatistics, number>()
    }

    public addAmount( stat : DefaultStatistics, amount : number = 1) {
        let statistic : number | undefined = this.statistics.get(stat)
        if(statistic) this.statistics.set(stat, amount + statistic)
        else this.statistics.set(stat, amount)
    }

    public takeAmount( stat : DefaultStatistics, amount : number = 1) {
        let statistic : number | undefined = this.statistics.get(stat)
        if(statistic) this.statistics.set(stat, statistic - amount)
    }

    public set(stat: DefaultStatistics, value : number) {
        let statistic : number | undefined = this.statistics.get(stat)
        if(statistic) this.statistics.set(stat, value)
        else this.statistics.set(stat, value)
    }

    public get(stat: DefaultStatistics) : number{
        let statistic : number | undefined = this.statistics.get(stat)
        return statistic ? statistic : 0 
    }

    public async submit() : Promise<boolean> {
        //Put categories and values in order into arrays
        let categories : string[] = []
        let values : number[] = []
        for(const element of Object.values(DefaultStatistics)) {
            categories.push(element)
            values.push(this.get(element))
        }
        //Fetch query data from other objects
        if(this.scene instanceof MainScene) {
            let room_id : string = this.scene.room.roomId
            let gotchi_id : number = this.player.playerSchema.gotchiID
            let wallet_address : string = this.player.playerSchema.walletAddress

            //Send data to chisel
            return axios.post(`${Config.apiURL}/game/add_statistics`, { 
                room_id: room_id, 
                gotchi_id: gotchi_id,
                wallet_address: wallet_address,
                categories: categories.join(','),
                values: values.join(',')
            }, {
                headers: {
                    'X-API-KEY': Config.apiKey
                }
            }). then(response => {
                return (response.status == 200)
            }).catch(error => {
                console.log(error);
                return false;
            })

        } else return false;      
    }

    private player : Player
    private statistics : Map<DefaultStatistics, number> 
}

export enum DefaultStatistics {
    PLAYTIME = "Playtime",
    BLOCKS_MINED = "Blocks mined",
    ENDGAME_CRYPTO = "Endgame crypto",
    DAMAGE_TAKEN = "Damage taken",
    DEATHS = "Deaths",
    AMOUNT_SPENT_EXPLOSIVES = "Amount spent on explosives",
    AMOUNT_SPENT_UPGRADE = "Amount spent on upgrades",
    TRAVELED_DISTANCE = "Traveled distance",
    FUEL_CONSUMED = "Fuel consumed",
    TOTAL_CRYPTO_MINED = "Total crypto"
}