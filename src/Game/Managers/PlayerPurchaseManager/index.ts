import Player from "../../Objects/Player";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import * as Chisel from "chisel-api-interface"
import MainScene from "../../Scenes/MainScene";
import { ExplosiveEntry } from "../../../Rooms/shared/schemas/Player/ExplosiveEntry";
import { MessageSerializer } from "gotchiminer-multiplayer-protocol";

export default class PlayerPurchaseManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerPurchaseManager")
        if(scene instanceof MainScene) {
            this.mainScene = scene
        }
        this.player = player
        this.player.client().messageRouter.addRoute(Protocol.PurchaseExplosive, this.handlePurchaseExplosive.bind(this))
    }

    private handlePurchaseExplosive(message : Protocol.PurchaseExplosive) {
        //Get explosive
        let explosive : Chisel.Explosive | undefined = this.mainScene.worldInfo.explosives.find(explosive => explosive.id == message.id)
        if (explosive) {
            //Take money, and add explosives to inventory
            let totalAmount : number = explosive.price * message.quantity
            if(this.player.walletManager().hasAmount(explosive.crypto_id, totalAmount)) {
                //Take money
                this.player.walletManager().takeAmount(explosive.crypto_id, totalAmount)
                //Add explosive to inventory
                let explosiveEntry : ExplosiveEntry | undefined = this.player.playerSchema.explosives.get(message.id.toString())
                if(explosiveEntry) {
                    explosiveEntry.amount += message.quantity
                } else {
                    explosiveEntry = new ExplosiveEntry()
                    explosiveEntry.amount = message.quantity
                    explosiveEntry.explosiveID = message.id
                    this.player.playerSchema.explosives.set(message.id.toString(), explosiveEntry)
                }
                //Notify player that transaction succeeded
                let transactionMessage : Protocol.NotifyPlayerTransation = new Protocol.NotifyPlayerTransation()
                transactionMessage.accepted = true
                transactionMessage.amount = totalAmount
                transactionMessage.cryptoId = explosive.crypto_id
                let serializedMessage : Protocol.Message = MessageSerializer.serialize(transactionMessage)
                this.player.client().client.send(serializedMessage.name, serializedMessage.data)
            } else {
                //Notify player that transaction failed
                let transactionMessage : Protocol.NotifyPlayerTransation = new Protocol.NotifyPlayerTransation()
                transactionMessage.accepted = false
                transactionMessage.amount = totalAmount
                transactionMessage.cryptoId = explosive.crypto_id
                let serializedMessage : Protocol.Message = MessageSerializer.serialize(transactionMessage)
                this.player.client().client.send(serializedMessage.name, serializedMessage.data)
            }
        }
    }
    

    private mainScene : MainScene
    private player : Player
}