import MainScene from "../../Scenes/MainScene";
import axios from "axios"
import { response } from "express";
import *  as Schema from "../../../Rooms/shared/schemas"
export default class ExchangeManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene) {
        super(scene, "ExchangeManager")
        this.mainScene = scene;
        this.fetchExchangeRates();
    }

    private async fetchExchangeRates() {
        this.mainScene.worldInfo.crypto.forEach(crypto => {
            axios.get(`https://polygon.api.0x.org/swap/v1/price?sellToken=DAI&buyToken=${crypto.wallet_address}&buyAmount=1000`).then(response => {
                let exchangeEntry : Schema.ExchangeEntry = new Schema.ExchangeEntry();
                exchangeEntry.crypto_id = crypto.id;
                exchangeEntry.usd_value = Number(response.data.price);
                this.mainScene.worldSchema.exchange.push(exchangeEntry)
            }).catch(error => {
                let exchangeEntry : Schema.ExchangeEntry = new Schema.ExchangeEntry();
                exchangeEntry.crypto_id = crypto.id;
                exchangeEntry.usd_value = 1;
                this.mainScene.worldSchema.exchange.push(exchangeEntry)
            })
        }, this);
    }

    private mainScene : MainScene
}