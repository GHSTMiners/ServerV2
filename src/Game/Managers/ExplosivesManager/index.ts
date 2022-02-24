import Player from "../../Objects/Player";
import BlockManager from "../BlockManager";
import PlayerManager from "../PlayerManager";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import MainScene from "../../Scenes/MainScene";
import { ExplosiveEntry } from "../../../Rooms/shared/schemas/Player/ExplosiveEntry";
import Explosive from "../../Objects/Explosive";
import * as Schema from "../../../Rooms/shared/schemas";
import * as Chisel from "chisel-api-interface";
import { SpawnType } from "chisel-api-interface";
import Block from "../../Objects/Block";
import Config from "../../../Config";

export default class ExplosivesManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, blockManager : BlockManager, playerManager : PlayerManager) {
        super(scene, "ExplosivesManager")
        this.mainScene = scene as MainScene
        //Create maps
        this.explosiveColliders = new Map<Explosive, Phaser.Physics.Arcade.Collider>()
        this.explosiveStaticBodies = new Map<Explosive, Phaser.Physics.Arcade.StaticGroup>()
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
                //Create staticgroup and collider
                let newStaticGroup : Phaser.Physics.Arcade.StaticGroup = this.scene.physics.add.staticGroup()
                this.explosiveStaticBodies.set(newExplosive, newStaticGroup)
                this.explosiveColliders.set(newExplosive, this.scene.physics.add.collider(newExplosive, newStaticGroup, null, this.processCollision))
                newExplosive.on(Explosive.BLOCK_POSITION_CHANGED, this.handleExplosiveBlockPositionChanged.bind(this, newExplosive))
            }
        }
    }

    private processCollision(player : Phaser.Types.Physics.Arcade.GameObjectWithBody, block : Phaser.Types.Physics.Arcade.GameObjectWithBody) : boolean {
        //Check if player should collide with collision object
        if(block instanceof Block) {
            return(block.blockSchema.spawnType != SpawnType.None)
        } else return true
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
                        let blockSchema : Schema.Block = this.blockManager.blockAt(x, y)
                        if(blockSchema && blockSchema.spawnType != SpawnType.None) {
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
        let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(explosionNotification)
        this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
        //Remove explosive schema
        let explosiveIndex : number = this.mainScene.worldSchema.explosives.indexOf(explosive.explosiveSchema)
        this.mainScene.worldSchema.explosives.deleteAt(explosiveIndex)
        //Remove blocks from the world
        let blockPosition : Phaser.Geom.Point = explosive.blockPosition()
        let block : Schema.Block | undefined =  this.blockManager.blockAt(blockPosition.x , blockPosition.y)
        if(block) { block.spawnType = Chisel.SpawnType.None }
        this.mainScene.worldInfo.explosives.find(({ id }) => id === explosive.explosiveSchema.explosiveID).explosion_coordinates.forEach(coordinate => {
            let block : Schema.Block | undefined =  this.blockManager.blockAt(blockPosition.x + coordinate.x, blockPosition.y + coordinate.y)
            if(block) {
                block.spawnType = Chisel.SpawnType.None
            }
        })
    }


    private mainScene : MainScene
    private blockManager : BlockManager
    private playerManager : PlayerManager
    private explosiveColliders : Map<Explosive, Phaser.Physics.Arcade.Collider>
    private explosiveStaticBodies : Map<Explosive, Phaser.Physics.Arcade.StaticGroup>
}