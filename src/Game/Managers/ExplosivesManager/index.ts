import Player from "../../Objects/Player";
import BlockManager from "../BlockManager";
import PlayerManager from "../PlayerManager";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import MainScene from "../../Scenes/MainScene";
import { ExplosiveEntry } from "../../../Rooms/shared/schemas/Player/ExplosiveEntry";
import Explosive from "../../Objects/Explosive";
import * as Schema from "../../../Rooms/shared/schemas";
export default class ExplosivesManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, blockManager : BlockManager, playerManager : PlayerManager) {
        super(scene, "ExplosivesManager")
        this.mainScene = scene as MainScene
        this.blockManager = blockManager
        this.playerManager = playerManager
        this.playerManager.on(PlayerManager.PLAYER_ADDED, this.handlePlayerJoined.bind(this))

    }    

    private handlePlayerJoined(player : Player) {
        this.mainScene.worldInfo.explosives.forEach(explosive => {
            let explosiveEntry : ExplosiveEntry = new ExplosiveEntry()
            explosiveEntry.amount = 20
            explosiveEntry.explosiveID = explosive.id
            player.playerSchema.explosives.set(explosive.id.toString(), explosiveEntry)
        })
        player.client().messageRouter.addRoute(Protocol.RequestDropExplosive, message => {
            this.playerRequestedDropExplosive(player, message)
        });
    }

    private playerRequestedDropExplosive(player : Player, message : Protocol.RequestDropExplosive) {
        //First we need to check whether the player has that kind of explosive in its inventory
        let explosiveEntry : ExplosiveEntry = player.playerSchema.explosives.get(message.explosiveID.toString())
        if (explosiveEntry) {
            if(explosiveEntry.amount > 0) {
                // Take some from the inventory
                explosiveEntry.amount -= 1
                // Add explosive to schema
                let newExplosiveSchema : Schema.Explosive = new Schema.Explosive()
                newExplosiveSchema.x = player.x
                newExplosiveSchema.y = player.y
                newExplosiveSchema.explosiveID = message.explosiveID
                this.mainScene.worldSchema.explosives.push(newExplosiveSchema)
                // Spawn the explosive
                let newExplosive : Explosive = new Explosive(this.scene, newExplosiveSchema)
                this.mainScene.add.existing(newExplosive)
                newExplosive.on(Explosive.EXPLODED, this.handleExplosiveDetonated.bind(this))
            }
        }
    }

    private handleExplosiveDetonated(explosive : Explosive) {
        //Notify all client of detonation
        let explosionNotification : Protocol.NotifyBombExploded = new Protocol.NotifyBombExploded()
        let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(explosionNotification)
        this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
        //Remove explosive schema
        let explosiveIndex : number = this.mainScene.worldSchema.explosives.indexOf(explosive.explosiveSchema)
        this.mainScene.worldSchema.explosives.deleteAt(explosiveIndex)
    }


    private mainScene : MainScene
    private blockManager : BlockManager
    private playerManager : PlayerManager
}