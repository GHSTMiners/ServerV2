import Player from "../../../Objects/Player";
import MainScene from "../../../Scenes/MainScene";
import axios from "axios"
import Config from "../../../../Config";
import { StatisticEntry } from "../../../../Schemas/Player/StatisticEntry";

export default class PlayerStatisticsManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, player: Player) {
        super(scene, "PlayerStatisticsManager")
        this.player = player
        this. submitted = false
        this.id_map = new Map<DefaultStatistics, number>()
        this.statistics = new Map<DefaultStatistics, number>()
        this.populateIdMap();
    }

    private populateIdMap() {
        this.id_map.set(DefaultStatistics.PLAYTIME, 1);
        this.id_map.set(DefaultStatistics.BLOCKS_MINED, 2);
        this.id_map.set(DefaultStatistics.ENDGAME_CRYPTO, 3);
        this.id_map.set(DefaultStatistics.DAMAGE_TAKEN, 4);
        this.id_map.set(DefaultStatistics.DEATHS, 5);
        this.id_map.set(DefaultStatistics.AMOUNT_SPENT_EXPLOSIVES, 6);
        this.id_map.set(DefaultStatistics.AMOUNT_SPENT_UPGRADE, 7);
        this.id_map.set(DefaultStatistics.TRAVELED_DISTANCE, 8);
        this.id_map.set(DefaultStatistics.FUEL_CONSUMED, 9);
        this.id_map.set(DefaultStatistics.TOTAL_CRYPTO_MINED, 10);

        this.set(DefaultStatistics.PLAYTIME,0);
        this.set(DefaultStatistics.BLOCKS_MINED,0);
        this.set(DefaultStatistics.ENDGAME_CRYPTO,0);
        this.set(DefaultStatistics.DAMAGE_TAKEN,0);
        this.set(DefaultStatistics.DEATHS,0);
        this.set(DefaultStatistics.AMOUNT_SPENT_EXPLOSIVES,0);
        this.set(DefaultStatistics.AMOUNT_SPENT_UPGRADE,0);
        this.set(DefaultStatistics.TRAVELED_DISTANCE,0);
        this.set(DefaultStatistics.FUEL_CONSUMED,0);
        this.set(DefaultStatistics.TOTAL_CRYPTO_MINED, 0);
    }

    public addAmount( stat : DefaultStatistics, amount : number = 1) {
        let statistic : number | undefined = this.statistics.get(stat)
        if(statistic) this.statistics.set(stat, amount + statistic)
        else this.statistics.set(stat, amount)
        this.updateSchema(stat)
    }

    public takeAmount( stat : DefaultStatistics, amount : number = 1) {
        let statistic : number | undefined = this.statistics.get(stat)
        if(statistic) this.statistics.set(stat, statistic - amount)
        this.updateSchema(stat)
    }

    public set(stat: DefaultStatistics, value : number) {
        let statistic : number | undefined = this.statistics.get(stat)
        if(statistic) this.statistics.set(stat, value)
        else this.statistics.set(stat, value)
        this.updateSchema(stat)
    }

    public get(stat: DefaultStatistics) : number{
        let statistic : number | undefined = this.statistics.get(stat)
        return statistic ? statistic : 0 
    }

    private updateSchema(stat: DefaultStatistics) {
        if(this.player.playerSchema.statistics.has(this.id_map.get(stat).toString())) {
            this.player.playerSchema.statistics.get(this.id_map.get(stat).toString()).value = this.statistics.get(stat)
        } else {
            let newEntry : StatisticEntry = new StatisticEntry()
            newEntry.id = this.id_map.get(stat)
            newEntry.value = this.statistics.get(stat)
            this.player.playerSchema.statistics.set(newEntry.id.toString(), newEntry)
        }
    }

    public async submit() : Promise<boolean> {
        var env = process.env.NODE_ENV || 'development';
        if(env == "development")  {
            return true
        }
        if(!this.submitted) {
            this.submitted = true
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
        } else return false;
    }

    private player : Player
    private submitted : boolean
    private statistics : Map<DefaultStatistics, number> 
    private id_map : Map<DefaultStatistics, number>
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