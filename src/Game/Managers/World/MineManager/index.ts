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

export default class MineManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, blockManager : BlockManager, playerManager : PlayerManager) {
        super(scene, "MineManager")
        this.mainScene = scene as MainScene
        //Create maps

        this.explosiveStaticBodies = new Map<Explosive, Phaser.Physics.Arcade.StaticGroup>()
        this.blockManager = blockManager
        this.playerManager = playerManager
        this.playerManager.on(PlayerManager.PLAYER_ADDED, this.handlePlayerJoined.bind(this))
        this.fallThroughLayers = new Array<number>()
        this.mainScene.worldInfo.fall_through_layers.forEach(layer => {
            this.fallThroughLayers.push(layer.layer)
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
                let newExplosive : Explosive = new Explosive(this.scene, newExplosiveSchema, player)
                this.mainScene.add.existing(newExplosive)
                newExplosive.on(Explosive.EXPLODED, this.handleExplosiveDetonated.bind(this))
                //Create staticgroup and collider
                let newStaticGroup : Phaser.Physics.Arcade.StaticGroup = this.scene.physics.add.staticGroup()
                this.explosiveStaticBodies.set(newExplosive, newStaticGroup)
                this.explosiveColliders.set(newExplosive, this.scene.physics.add.collider(newExplosive, newStaticGroup, null, this.processCollision))
                newExplosive.on(Explosive.BLOCK_POSITION_CHANGED, this.handleExplosiveBlockPositionChanged.bind(this, newExplosive))
                //Create collision with players
                this.explosivePlayerColliders.set(newExplosive, this.scene.physics.add.collider(this.playerManager.players(), newExplosive))
            }
        }
    }

    private processCollision(player : Phaser.Types.Physics.Arcade.GameObjectWithBody, block : Phaser.Types.Physics.Arcade.GameObjectWithBody) : boolean {
        //Check if player should collide with collision object
        if(block instanceof Block) {
            switch (block.blockSchema.read().spawnType) {
                case SpawnType.None:
                case SpawnType.FallThrough:
                    return false
            }
        }
        return true
    }

    private handleExplosiveBlockPositionChanged(explosive : Explosive, prevPosition : Phaser.Geom.Point, newPosition : Phaser.Geom.Point) {
        //Mark layer dirty so schema gets sent to explosive 
        let renderRectangle : Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(newPosition.x - Config.blockCollisionRadio, newPosition.y - Config.blockCollisionRadio, Config.blockCollisionRadio*2, Config.blockCollisionRadio*2)
        let revealLayers : Phaser.Geom.Line = new Phaser.Geom.Line(0, newPosition.y - Config.layerRevealRadius, 0, newPosition.y + Config.layerRevealRadius)
        //Get a list of layers that are not revealed
        let newRevealLayers : Phaser.Types.Math.Vector2Like[] = []
        Phaser.Geom.Line.BresenhamPoints(revealLayers, 1, newRevealLayers)
        //Create new collision group
        let staticGroup : Phaser.Physics.Arcade.StaticGroup | undefined = this.explosiveStaticBodies.get(explosive)
        if(staticGroup) {
            staticGroup.clear(true, true)
            for (let y = renderRectangle.y; y < (renderRectangle.y + renderRectangle.height); y++) {
                for (let x = renderRectangle.x; x < (renderRectangle.x + renderRectangle.width); x++) {
                    if(x >=0 && this.mainScene.worldInfo.width >= x && y >= 0 && this.mainScene.worldInfo.height >= y) {
                        let blockSchema : BlockSchemaWrapper = this.blockManager.blockAt(x, y)
                        if(blockSchema && blockSchema.read().spawnType != SpawnType.None) {
                            staticGroup.add(new Block(this.scene, blockSchema, x*Config.blockWidth+Config.blockWidth/2, y*Config.blockHeight+Config.blockHeight/2, Config.blockWidth, Config.blockHeight))
                        }
                    }
                }
            }
        }
    }

    private handleExplosiveDetonated(explosive : Explosive) {
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
        //Remove static bodies
        this.explosiveStaticBodies.get(explosive).destroy()
        this.explosiveStaticBodies.delete(explosive)
        //Remove colliders
        this.explosiveColliders.get(explosive).destroy()
        this.explosiveColliders.delete(explosive)
        this.explosivePlayerColliders.get(explosive).destroy()
        this.explosivePlayerColliders.delete(explosive)
        
    }


    private mainScene : MainScene
    private blockManager : BlockManager
    private playerManager : PlayerManager
    private fallThroughLayers : Array<number>
    private explosiveColliders : Map<Explosive, Phaser.Physics.Arcade.Collider>
    private explosivePlayerColliders : Map<Explosive, Phaser.Physics.Arcade.Collider>
    private explosiveStaticBodies : Map<Explosive, Phaser.Physics.Arcade.StaticGroup>
}