import MainScene from "../../../Scenes/MainScene";
import axios from "axios"
import * as Protocol from "gotchiminer-multiplayer-protocol"
import *  as Schema from "../../../../Schemas"
import PlayerManager from "../PlayerManager";
import Player from "../../../Objects/Player";


export default class ExchangeManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, playerManager : PlayerManager) {
        super(scene, "ExchangeManager")
        this.mainScene = scene;
        this.playerManager = playerManager;
        this.fetchExchangeRates();
        this.playerManager.on(PlayerManager.PLAYER_ADDED, this.handlePlayerJoined.bind(this))
    }

    private async fetchExchangeRates() {
        this.mainScene.worldInfo.crypto.forEach(crypto => {
            axios.get(`https://polygon.api.0x.org/swap/v1/price?sellToken=DAI&buyToken=${crypto.wallet_address}&buyAmount=1000`).then(response => {
                let exchangeEntry : Schema.ExchangeEntry = new Schema.ExchangeEntry();
                exchangeEntry.crypto_id = crypto.id;
                exchangeEntry.usd_value = Number(response.data.price);
                this.mainScene.worldSchema.exchange.set(crypto.id.toString(), exchangeEntry)
            }).catch(error => {
                let exchangeEntry : Schema.ExchangeEntry = new Schema.ExchangeEntry();
                exchangeEntry.crypto_id = crypto.id;
                exchangeEntry.usd_value = 1;
                this.mainScene.worldSchema.exchange.set(crypto.id.toString(), exchangeEntry)
            })
        }, this);
    }

    private calculateExchangeAmount(sourceCrypto : number, targetCrypto : number, amount : number) : number{
        let sourceExchangeCrypto : Schema.ExchangeEntry | undefined = this.mainScene.worldSchema.exchange.get(sourceCrypto.toString())
        let targetExchangeCrypto : Schema.ExchangeEntry | undefined = this.mainScene.worldSchema.exchange.get(targetCrypto.toString())
        let exchangeAmount = Math.round( amount * (sourceExchangeCrypto.usd_value / targetExchangeCrypto.usd_value) * 10 ) / 10;
        return  exchangeAmount
    }

    private handlePlayerJoined(player : Player) {
        var self = this;
        // Create message handler
        player.client().messageRouter.addRoute(Protocol.ExchangeCrypto, message => {
            self.handleExchangeRequest(player, message);
        })
    }

    private handleExchangeRequest(player : Player, message : Protocol.ExchangeCrypto) {
        //Prepare message
        let exchangeNotification : Protocol.NotifyPlayerExchangedCrypto = new Protocol.NotifyPlayerExchangedCrypto()
        exchangeNotification.sourceCryptoId = message.sourceCryptoId
        exchangeNotification.targetCryptoId = message.targetCryptoId
        exchangeNotification.amount = message.amount
        //Check if player has crypto if so take it
        if(player.walletManager().hasAmount(message.sourceCryptoId, message.amount)) {
            player.walletManager().takeAmount(message.sourceCryptoId, message.amount)
            player.walletManager().addAmount(message.targetCryptoId, this.calculateExchangeAmount(message.sourceCryptoId, message.targetCryptoId, message.amount));
            exchangeNotification.accepted = true
        }
        //Send message
        let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(exchangeNotification)
        player.client().client.send(serializedMessage.name, serializedMessage.data)
    }
    

    private playerManager : PlayerManager
    private mainScene : MainScene
}