import Player from "../../../Objects/Player";
import BlockManager from "../BlockManager";
import PlayerManager from "../../World/PlayerManager";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import MainScene from "../../../Scenes/MainScene";
import { ExplosiveEntry } from "../../../../Schemas/Player/ExplosiveEntry";
import Explosive from "../../../Objects/Explosive";
import * as Schema from "../../../../Schemas";
import * as Chisel from "chisel-api-interface";
import { ExplosionCoordinate, SpawnType } from "chisel-api-interface";
import Block from "../../../Objects/Block";
import Config from "../../../../Config";
import PlayerCollisionManager from "../../Player/PlayerCollisionManager";
import PlayerVitalsManager, { DefaultVitals } from "../../Player/PlayerVitalsManager";
import { BlockInterface, BlockSchemaWrapper } from "../../../../Helpers/BlockSchemaWrapper";
import Mine from "../../../Objects/Mine";

export default class MineManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, blockManager : BlockManager, playerManager : PlayerManager) {
        super(scene, "MineManager")
        this.mainScene = scene as MainScene
        //Create maps
        this.explosiveMap = new Map<number, Chisel.Explosive>()
        this.blockManager = blockManager
        this.playerManager = playerManager
        this.playerManager.on(PlayerManager.PLAYER_ADDED, this.handlePlayerJoined.bind(this))
        this.fallThroughLayers = new Array<number>()
        this.mainScene.worldInfo.fall_through_layers.forEach(layer => {
            this.fallThroughLayers.push(layer.layer)
        })
        this.mainScene.worldInfo.explosives.forEach(explosive => {
            if(explosive.mine) this.explosiveMap.set(explosive.id, explosive);
        })
    }    

    private handlePlayerJoined(player : Player) {
        player.client().messageRouter.addRoute(Protocol.RequestDropExplosive, (message: any) => {
            this.playerRequestedDropExplosive(player, message)
        });
    }

    private playerRequestedDropExplosive(player : Player, message : Protocol.RequestDropExplosive) {
        //First we need to check whether the player has that kind of explosive in its inventory
        let explosiveEntry : ExplosiveEntry = player.playerSchema.explosives.get(message.explosiveID.toString())
        if (explosiveEntry && this.explosiveMap.has(message.explosiveID)) {
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
                let newExplosive : Mine = new Mine(this.scene, newExplosiveSchema, this.explosiveMap.get(message.explosiveID), player)
                this.mainScene.add.existing(newExplosive)
                newExplosive.on(Mine.EXPLODED, this.handleExplosiveDetonated.bind(this))
                //Create staticgroup and collider
                let newStaticGroup : Phaser.Physics.Arcade.StaticGroup = this.scene.physics.add.staticGroup()
            }
        }
    }


    private handleExplosiveDetonated(explosive : Mine) {
        //Notify all client of detonation
        let explosionNotification : Protocol.NotifyBombExploded = new Protocol.NotifyBombExploded()
        explosionNotification.bombId = explosive.explosiveSchema.explosiveID
        explosionNotification.x = explosive.blockPosition().x
        explosionNotification.y = explosive.blockPosition().y
        let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(explosionNotification)
        this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
        //Remove explosive schema
        let explosiveIndex : number = this.mainScene.worldSchema.explosives.indexOf(explosive.explosiveSchema)
        this.mainScene.worldSchema.explosives.deleteAt(explosiveIndex)
        //Remove blocks from the world
        let blockPosition : Phaser.Geom.Point = explosive.blockPosition()
        let block : BlockSchemaWrapper | undefined =  this.blockManager.blockAt(blockPosition.x , blockPosition.y)
        if(block) { 
            let blockInterface : BlockInterface = block.read()
            blockInterface.spawnType = Chisel.SpawnType.None 
            block.write(blockInterface)
        }
        let explosionCoordinates : ExplosionCoordinate[] = this.mainScene.worldInfo.explosives.find(({ id }) => id === explosive.explosiveSchema.explosiveID).explosion_coordinates
        let ownCoordinate = {x : 0, y : 0, explosive_id: explosive.explosiveSchema.explosiveID} as ExplosionCoordinate;
        explosionCoordinates.push(ownCoordinate)
        explosionCoordinates.forEach(coordinate => {
            //Calculate coordinates
            let explosionPoint : Phaser.Geom.Point = new Phaser.Geom.Point(blockPosition.x + coordinate.y, blockPosition.y + coordinate.x)
            //Take health from player
            this.playerManager.playersAt(explosionPoint).forEach(player => {
                player.vitalsManager().get(DefaultVitals.HEALTH).takeAmount(200, {reason : Protocol.DeathReason.Exploded, perpetratorGotchiId: explosive.owner.playerSchema.gotchiID})
            })
            //Destroy blocks
            let block : BlockSchemaWrapper | undefined =  this.blockManager.blockAt(explosionPoint.x, explosionPoint.y)
            if(block) {
                let blockInterface : BlockInterface = block.read()
                // Check if should be a fallthrough layer
                if (this.fallThroughLayers.indexOf(explosionPoint.y) != -1) {
                    blockInterface.spawnType = Chisel.SpawnType.FallThrough
                } else {
                    blockInterface.spawnType = Chisel.SpawnType.None
                }
                block.write(blockInterface)
            }
        })
    }


    private mainScene : MainScene
    private blockManager : BlockManager
    private playerManager : PlayerManager
    private explosiveMap : Map<number, Chisel.Explosive>
    private fallThroughLayers : Array<number>
}