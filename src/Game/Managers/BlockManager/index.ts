import { World } from "../../../Rooms/shared/schemas/World/World";
import { ArraySchema, type } from "@colyseus/schema"
import * as Schema from "../../../Rooms/shared/schemas";
import Config from "../../../Config";
import PlayerManager from "../PlayerManager";
import Player from "../../Objects/Player";
import Block from "../../Objects/Block";
import { SpawnType } from "chisel-api-interface";
import PlayerExcavationManager from "../PlayerExcavationManager";
import PlayerMovementManager from "../PlayerMovementManager";

export default class BlockManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, world : World, playerManager : PlayerManager) {
        super(scene, "BlockManager") 
        this.world = world

        //Create maps
        this.colliders = new Map<Player, Phaser.Physics.Arcade.Collider>()
        this.staticBodies = new Map<Player, Phaser.Physics.Arcade.StaticGroup>()

        // Set world bounds
        this.scene.physics.world.setBounds(0, -Config.skyHeight, 
            world.width * Config.blockWidth, Config.skyHeight + world.height * Config.blockHeight, true, true, true, true)
        // Register event handlers
        playerManager.on(PlayerManager.PLAYER_ADDED, this.handlePlayerAdded.bind(this))
        playerManager.on(PlayerManager.PLAYER_REMOVED, this.handlePlayerDeleted.bind(this))
    }

    private handlePlayerAdded(player : Player) {
        //Create staticgroup and collider
        let newStaticGroup : Phaser.Physics.Arcade.StaticGroup = this.scene.physics.add.staticGroup()
        this.staticBodies.set(player, newStaticGroup)
        this.colliders.set(player, this.scene.physics.add.collider(player, newStaticGroup, null, this.processCollision))
        player.movementManager().on(PlayerMovementManager.BLOCK_POSITION_CHANGED, this.handlePlayerBlockPositionChanged.bind(this, player))
    }

    private processCollision(player : Phaser.Types.Physics.Arcade.GameObjectWithBody, block : Phaser.Types.Physics.Arcade.GameObjectWithBody) : boolean {
        if(block instanceof Block) {
            return(block.blockSchema.spawnType != SpawnType.None)
        } else return true
    }

    private handlePlayerDeleted(player : Player) {
        let staticGroup : Phaser.Physics.Arcade.StaticGroup | undefined = this.staticBodies.get(player)
        let collider : Phaser.Physics.Arcade.Collider | undefined = this.colliders.get(player)

        if(staticGroup && collider) {
            staticGroup.destroy(true, true)
            collider.destroy()
            this.staticBodies.delete(player)
            this.colliders.delete(player)
            staticGroup.destroy()
        }
    }

    public setLayerDirty(layer : number) {
        if(layer > 0 && layer < this.world.height) {
            this.world.layers[layer].setDirty(0)
        }
    }

    public blockAt(x : number, y : number) : Schema.Block | undefined {
        if(y < 0 || y > this.world.height) return null
        else if(x < 0 || x > this.world.width) return null
        return this.world.layers[y].blocks[x]
    }

    private handlePlayerBlockPositionChanged(player : Player, prevPosition : Phaser.Geom.Point, newPosition : Phaser.Geom.Point) {
        //Mark layer dirty so schema gets sent to player 
        let renderRectangle : Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(newPosition.x - Config.blockCollisionRadio, newPosition.y - Config.blockCollisionRadio, Config.blockCollisionRadio*2, Config.blockCollisionRadio*2)
        let revealLayers : Phaser.Geom.Line = new Phaser.Geom.Line(0, newPosition.y - Config.layerRevealRadius, 0, newPosition.y + Config.layerRevealRadius)
        //Get a list of layers that are not revealed
        let newRevealLayers : Phaser.Types.Math.Vector2Like[] = []
        Phaser.Geom.Line.BresenhamPoints(revealLayers, 1, newRevealLayers)
        newRevealLayers.forEach(layer => {
            if(layer.y >= 0) this.world.layers[layer.y].setDirty(0)
        }, this)
        //Create new collision group
        let staticGroup : Phaser.Physics.Arcade.StaticGroup | undefined = this.staticBodies.get(player)
        if(staticGroup) {
            staticGroup.clear(true, true)
            for (let y = renderRectangle.y; y < (renderRectangle.y + renderRectangle.height); y++) {
                this.setLayerDirty(y)
                for (let x = renderRectangle.x; x < (renderRectangle.x + renderRectangle.width); x++) {
                    if(x >=0 && this.world.width >= x && y >= 0 && this.world.height >= y) {
                        let blockSchema : Schema.Block = this.blockAt(x, y)
                        if(blockSchema && blockSchema.spawnType != SpawnType.None) {
                            staticGroup.add(new Block(this.scene, blockSchema, x*Config.blockWidth+Config.blockWidth/2, y*Config.blockHeight+Config.blockHeight/2, Config.blockWidth, Config.blockHeight))
                        }
                    }
                }
            }
        }
    }

    private colliders : Map<Player, Phaser.Physics.Arcade.Collider>
    private staticBodies : Map<Player, Phaser.Physics.Arcade.StaticGroup>
    private world : World
}