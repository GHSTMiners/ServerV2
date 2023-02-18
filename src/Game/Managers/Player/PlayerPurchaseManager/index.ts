import Player from "../../../Objects/Player";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import * as Chisel from "chisel-api-interface"
import MainScene from "../../../Scenes/MainScene";
import { ExplosiveEntry } from "../../../../Schemas/Player/ExplosiveEntry";
import { ConsumableEntry } from "../../../../Schemas/Player/ConsumableEntry";
import { MessageSerializer } from "gotchiminer-multiplayer-protocol";
import { UpgradeTier } from "../PlayerUpgradeManager";

export default class PlayerPurchaseManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerPurchaseManager")
        if(scene instanceof MainScene) {
            this.mainScene = scene
        }
        this.player = player
        this.player.client().messageRouter.addRoute(Protocol.PurchaseUpgrade, this.handlePurchaseUpgrade.bind(this))
        this.player.client().messageRouter.addRoute(Protocol.PurchaseExplosive, this.handlePurchaseExplosive.bind(this))
        this.player.client().messageRouter.addRoute(Protocol.PurchaseConsumable, this.handlePurchaseConsumable.bind(this))

    }

    private handlePurchaseUpgrade(message : Protocol.PurchaseUpgrade) {
        //Get upgrade
        let upgrade : Chisel.Upgrade | undefined = this.mainScene.worldInfo.upgrades.find(upgrade => upgrade.id == message.id)
        if(upgrade) {
            //Get current tier
            let currentTier : UpgradeTier = this.player.upgradeManager().upgrade(upgrade.id).tier()
            //Check if request is for next tier in line
            if((currentTier+1) == this.player.upgradeManager().stringToTierNr(message.tier.toString())) {
                //Check if player has the dough for this upgrade
                let hasAmounts : boolean = true
                upgrade.prices.forEach(price => {
                    //Get tier price amount
                    let tierPrice : number | undefined = null;
                    let tier : number = this.player.upgradeManager().stringToTierNr(message.tier.toString())
                    if(tier == Protocol.PurchaseUpgrade.Tier.Uncommon) tierPrice = price.tier_1
                    else if(tier == Protocol.PurchaseUpgrade.Tier.Rare) tierPrice = price.tier_2
                    else if(tier == Protocol.PurchaseUpgrade.Tier.Legendary) tierPrice = price.tier_3
                    else if(tier == Protocol.PurchaseUpgrade.Tier.Mythical) tierPrice = price.tier_4
                    else if(tier == Protocol.PurchaseUpgrade.Tier.Godlike) tierPrice = price.tier_5
                    else hasAmounts = false
                    if(tierPrice) hasAmounts = (hasAmounts && this.player.walletManager().hasAmount(price.crypto_id, tierPrice))
                }, this)
                if(hasAmounts) {
                    //Take the money and process the upgrade
                    upgrade.prices.forEach(price => {
                        //Get tier price amount
                        let tierPrice : number = 0;
                        let tier : number = this.player.upgradeManager().stringToTierNr(message.tier.toString())
                        if(tier == Protocol.PurchaseUpgrade.Tier.Uncommon) tierPrice = price.tier_1
                        else if(tier == Protocol.PurchaseUpgrade.Tier.Rare) tierPrice = price.tier_2
                        else if(tier == Protocol.PurchaseUpgrade.Tier.Legendary) tierPrice = price.tier_3
                        else if(tier == Protocol.PurchaseUpgrade.Tier.Mythical) tierPrice = price.tier_4
                        else if(tier == Protocol.PurchaseUpgrade.Tier.Godlike) tierPrice = price.tier_5
                        this.player.walletManager().takeAmount(price.crypto_id, tierPrice)
                    }, this)
                    this.player.upgradeManager().upgrade(upgrade.id).increaseTier()
                } else {
                    console.debug(`Player cannot afford this upgrade`)
                }
            } else {
                console.debug(`Player tried to skip a tier`)
            }
        }
    }

    private handlePurchaseExplosive(message : Protocol.PurchaseExplosive) {
        //Get explosive
        let explosive : Chisel.Explosive | undefined = this.mainScene.worldInfo.explosives.find(explosive => explosive.id == message.id)
        if (explosive) {
            //Take money, and add explosives to inventory
            let totalAmount : number = explosive.price * message.quantity
            let limitReached : boolean = false
            let explosiveEntry : ExplosiveEntry | undefined = this.player.playerSchema.explosives.get(message.id.toString())
            // Check if player has reached the spending limit 
            if(explosiveEntry && explosive.purchase_limit > 0) {
                limitReached = (explosiveEntry.amountPurchased + message.quantity) > explosive.purchase_limit
            }
            if(this.player.walletManager().hasAmount(explosive.crypto_id, totalAmount) && !limitReached) {
                //Add explosive to inventory
                if(explosiveEntry) {
                    explosiveEntry.amount += message.quantity
                    explosiveEntry.amountPurchased += message.quantity
                } else {
                    explosiveEntry = new ExplosiveEntry()
                    explosiveEntry.amount = message.quantity
                    explosiveEntry.explosiveID = message.id
                    explosiveEntry.amountPurchased = message.quantity
                    this.player.playerSchema.explosives.set(message.id.toString(), explosiveEntry)
                }
                //Take money
                this.player.walletManager().takeAmount(explosive.crypto_id, totalAmount)
                //Notify player that transaction succeeded
                let transactionMessage : Protocol.NotifyPlayerTransaction = new Protocol.NotifyPlayerTransaction({gotchiId : this.player.playerSchema.gotchiID})
                transactionMessage.accepted = true
                transactionMessage.amount = totalAmount
                transactionMessage.cryptoId = explosive.crypto_id
                let serializedMessage : Protocol.Message = MessageSerializer.serialize(transactionMessage)
                this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
                //Emit event
                this.emit(PlayerPurchaseManager.PURCHASED_EXPLOSIVE, explosive);
            } else {
                //Notify player that transaction failed
                let transactionMessage : Protocol.NotifyPlayerTransaction = new Protocol.NotifyPlayerTransaction({gotchiId : this.player.playerSchema.gotchiID})
                transactionMessage.accepted = false
                transactionMessage.amount = totalAmount
                transactionMessage.cryptoId = explosive.crypto_id
                let serializedMessage : Protocol.Message = MessageSerializer.serialize(transactionMessage)
                this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
            }
        }
    }

    private handlePurchaseConsumable(message : Protocol.PurchaseConsumable) {
        //Get explosive
        let consumable : Chisel.Consumable | undefined = this.mainScene.worldInfo.consumables.find(consumable => consumable.id == message.id)
        if (consumable) {
            //Take money, and add consumables to inventory
            let totalAmount : number = consumable.price * message.quantity
            let limitReached : boolean = false
            let consumableEntry : ConsumableEntry | undefined = this.player.playerSchema.consumables.get(message.id.toString())
            // Check if player has reached the spending limit 
            if(consumableEntry && consumable.purchase_limit > 0) {
                limitReached = (consumableEntry.amountPurchased + message.quantity) > consumable.purchase_limit
            }
            if(this.player.walletManager().hasAmount(consumable.crypto_id, totalAmount) && !limitReached) {
                //Add consumable to inventory
                if(consumableEntry) {
                    consumableEntry.amount += message.quantity
                    consumableEntry.amountPurchased += message.quantity
                } else {
                    consumableEntry = new ConsumableEntry()
                    consumableEntry.amount = message.quantity
                    consumableEntry.consumableID = message.id
                    consumableEntry.amountPurchased = message.quantity
                    this.player.playerSchema.consumables.set(message.id.toString(), consumableEntry)
                }
                //Take money
                this.player.walletManager().takeAmount(consumable.crypto_id, totalAmount)
                //Notify player that transaction succeeded
                let transactionMessage : Protocol.NotifyPlayerTransaction = new Protocol.NotifyPlayerTransaction({gotchiId : this.player.playerSchema.gotchiID})
                transactionMessage.accepted = true
                transactionMessage.amount = totalAmount
                transactionMessage.cryptoId = consumable.crypto_id
                let serializedMessage : Protocol.Message = MessageSerializer.serialize(transactionMessage)
                this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
                //Emit event
                this.emit(PlayerPurchaseManager.PURCHASED_CONSUMABLE, consumable);
            } else {
                //Notify player that transaction failed
                let transactionMessage : Protocol.NotifyPlayerTransaction = new Protocol.NotifyPlayerTransaction({gotchiId : this.player.playerSchema.gotchiID})
                transactionMessage.accepted = false
                transactionMessage.amount = totalAmount
                transactionMessage.cryptoId = consumable.crypto_id
                let serializedMessage : Protocol.Message = MessageSerializer.serialize(transactionMessage)
                this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
            }
        }
    }
    
    static readonly PURCHASED_EXPLOSIVE: unique symbol = Symbol();
    static readonly PURCHASED_CONSUMABLE: unique symbol = Symbol();

    private mainScene : MainScene
    private player : Player
}