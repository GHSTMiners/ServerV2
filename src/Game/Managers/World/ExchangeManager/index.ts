import MainScene from "../../../Scenes/MainScene";
import needle from "needle"
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
            this.mainScene.room.presence.exists(`crypto_${crypto.id}_price`).then(exists => {
                if(exists) {
                    let exchangeEntry : Schema.ExchangeEntry = new Schema.ExchangeEntry();
                    exchangeEntry.crypto_id = crypto.id;
                    exchangeEntry.usd_value = Number(this.mainScene.room.presence.get(`crypto_${crypto.id}_price`));
                    this.mainScene.worldSchema.exchange.set(crypto.id.toString(), exchangeEntry)
                } else {
                    needle('get', `https://polygon.api.0x.org/swap/v1/price?sellToken=DAI&buyToken=${crypto.wallet_address}&buyAmount=1000`).then(response => {
                        if(response.statusCode == 200) {
                            let exchangeEntry : Schema.ExchangeEntry = new Schema.ExchangeEntry();
                            exchangeEntry.crypto_id = crypto.id;
                            exchangeEntry.usd_value = Number(response.body.price);
                            this.mainScene.worldSchema.exchange.set(crypto.id.toString(), exchangeEntry)
                            this.mainScene.room.presence.setex(`crypto_${crypto.id}_price`, exchangeEntry.usd_value.toString(), 60 * 60)
                        } else {
                            let exchangeEntry : Schema.ExchangeEntry = new Schema.ExchangeEntry();
                            exchangeEntry.crypto_id = crypto.id;
                            exchangeEntry.usd_value = 1;
                            this.mainScene.worldSchema.exchange.set(crypto.id.toString(), exchangeEntry)  
                        }
                    }).catch(error => {
                        let exchangeEntry : Schema.ExchangeEntry = new Schema.ExchangeEntry();
                        exchangeEntry.crypto_id = crypto.id;
                        exchangeEntry.usd_value = 1;
                        this.mainScene.worldSchema.exchange.set(crypto.id.toString(), exchangeEntry)
                    })
                }
            })
        }, this);
    }

    public dollarValue(crypto : number, amount : number) : number{
        let exchangeCrypto : Schema.ExchangeEntry | undefined = this.mainScene.worldSchema.exchange.get(crypto.toString())
        let exchangeAmount = Math.round( amount * exchangeCrypto.usd_value )
        return exchangeAmount
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
        let exchangeNotification : Protocol.NotifyPlayerExchangedCrypto = new Protocol.NotifyPlayerExchangedCrypto({gotchiId: player.playerSchema.gotchiID})
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
        this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
    }
    

    private playerManager : PlayerManager
    private mainScene : MainScene
}