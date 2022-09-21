import { World } from "../../../../Schemas"
import Player from "../../../Objects/Player"
import BlockManager from "../../World/BlockManager"
import PlayerManager from "../../World/PlayerManager"
import Block from "../../../Objects/Block";
import { SpawnType } from "chisel-api-interface";
import PlayerMovementManager from "../PlayerMovementManager";
import { DefaultSkills } from "../PlayerSkillManager";
import { DefaultVitals } from "../PlayerVitalsManager";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import * as Schema from "../../../../Schemas";
import Config from "../../../../Config";
import MainScene from "../../../Scenes/MainScene";
import { BlockInterface, BlockSchemaWrapper } from "../../../../Helpers/BlockSchemaWrapper";

export default class PlayerCollisionManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, playerManager : PlayerManager, blockManager : BlockManager, world : World) {
        super(scene, "BlockManager") 
        this.world = world
        this.blockManager = blockManager

        //Create maps and groups
        this.playerColliders = new Map<Player, Phaser.Physics.Arcade.Collider>()
        this.playerStaticBodies = new Map<Player, Phaser.Physics.Arcade.StaticGroup>()
         
        // Register event handlers
        playerManager.on(PlayerManager.PLAYER_ADDED, this.handlePlayerAdded.bind(this))
        playerManager.on(PlayerManager.PLAYER_REMOVED, this.handlePlayerDeleted.bind(this))


        //Find top of world
        let worldHeight : number = 1000
        if(scene instanceof MainScene) {
            scene.worldInfo.backgrounds.forEach(background =>{
                if(background.ending_layer < worldHeight) worldHeight = background.ending_layer
            })
        }
        // Set world bounds
        this.scene.physics.world.setBounds(0, worldHeight * Config.blockHeight, 
            world.width * Config.blockWidth, -worldHeight + world.height * Config.blockHeight, true, true, true, true)
    }

    private handlePlayerAdded(player : Player) {
        //Create staticgroup and collider
        let newStaticGroup : Phaser.Physics.Arcade.StaticGroup = this.scene.physics.add.staticGroup()
        this.playerStaticBodies.set(player, newStaticGroup)
        this.playerColliders.set(player, this.scene.physics.add.collider(player, newStaticGroup, this.handleCollision, this.processCollision))
        player.movementManager().on(PlayerMovementManager.BLOCK_POSITION_CHANGED, this.handlePlayerBlockPositionChanged.bind(this, player))
    }

    private handlePlayerDeleted(player : Player) {
        let staticGroup : Phaser.Physics.Arcade.StaticGroup | undefined = this.playerStaticBodies.get(player)
        let collider : Phaser.Physics.Arcade.Collider | undefined = this.playerColliders.get(player)
        if(staticGroup && collider) {
            staticGroup.destroy(true, true)
            collider.destroy()
            this.playerStaticBodies.delete(player)
            this.playerColliders.delete(player)
            staticGroup.destroy()
        }
    }

    private handleCollision(player : Phaser.Types.Physics.Arcade.GameObjectWithBody, block : Phaser.Types.Physics.Arcade.GameObjectWithBody) : boolean {
        //Process damage
        if(player instanceof Player && player.body instanceof Phaser.Physics.Arcade.Body) {
            let maxSpeedBeforeDamage : number = Config.blockHeight * player.skillManager().get(DefaultSkills.MAX_SPEED_BEFORE_DAMAGE).value();
            if(player.body.speed > maxSpeedBeforeDamage) {
                // console.log(`Touching down: ${player.body.touching.down}, touching left: ${player.body.touching.left}, touching right: ${player.body.touching.right}`)
                // If player is moving walking fast, ignore events
                if(player.body.touching.down) {
                    if(player.body.y < block.body.y) {
                        if(Math.abs(player.body.velocity.y) < Math.abs(player.body.velocity.x)) {
                            return false;
                        }  
                    }
                }
                //Ignore walls when falling down
                if(Math.abs(player.body.velocity.y) > Math.abs(player.body.velocity.x)) {
                    if ((player.body.touching.left) || (player.body.touching.right)) return false;
                }
                //Notify client of collision
                let colisionMessage : Protocol.NotifyPlayerCollision = new Protocol.NotifyPlayerCollision()
                let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(colisionMessage)
                player.client().client.send(serializedMessage.name, serializedMessage.data)

                //Take health from client
                let healthToTake : number = 12.5 * (player.body.speed - maxSpeedBeforeDamage) / Config.blockHeight
                player.vitalsManager().get(DefaultVitals.HEALTH).takeAmount(healthToTake)
            }
        }
    }

    
    private processCollision(player : Phaser.Types.Physics.Arcade.GameObjectWithBody, block : Phaser.Types.Physics.Arcade.GameObjectWithBody) : boolean {
        //Check if player should collide with collision object
        if(block instanceof Block) {
            switch (block.blockSchema.read().spawnType) {
                case SpawnType.None:
                    return false;
                case SpawnType.FallThrough:
                    if(player instanceof Player){
                        if(player.body.velocity.y < 0) return false
                        if(player.movementManager().getLastDirection().y > 0) return false
                    }
            }
        }
        return true
    }

    private handlePlayerBlockPositionChanged(player : Player, prevPosition : Phaser.Geom.Point, newPosition : Phaser.Geom.Point) {
        //Mark layer dirty so schema gets sent to player 
        let renderRectangle : Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(newPosition.x - Config.blockCollisionRadio, newPosition.y - Config.blockCollisionRadio, Config.blockCollisionRadio*2, Config.blockCollisionRadio*2)
        let revealLayers : Phaser.Geom.Line = new Phaser.Geom.Line(0, newPosition.y - Config.layerRevealRadius, 0, newPosition.y + Config.layerRevealRadius)
        //Get a list of layers that are not revealed
        let newRevealLayers : Phaser.Types.Math.Vector2Like[] = []
        Phaser.Geom.Line.BresenhamPoints(revealLayers, 1, newRevealLayers)
        //Create new collision group
        let staticGroup : Phaser.Physics.Arcade.StaticGroup | undefined = this.playerStaticBodies.get(player)
        if(staticGroup) {
            staticGroup.clear(true, true)
            for (let y = renderRectangle.y; y < (renderRectangle.y + renderRectangle.height); y++) {
                for (let x = renderRectangle.x; x < (renderRectangle.x + renderRectangle.width); x++) {
                    if(x >=0 && this.world.width >= x && y >= 0 && this.world.height >= y) {
                        let blockSchema : BlockSchemaWrapper = this.blockManager.blockAt(x, y)
                        if(blockSchema && blockSchema.read().spawnType != SpawnType.None) {
                            staticGroup.add(new Block(this.scene, blockSchema, x*Config.blockWidth+Config.blockWidth/2, y*Config.blockHeight+Config.blockHeight/2, Config.blockWidth, Config.blockHeight))
                        }
                    }
                }
            }
        }
    }

    private world : World
    private blockManager : BlockManager
    private playerColliders : Map<Player, Phaser.Physics.Arcade.Collider>
    private playerStaticBodies : Map<Player, Phaser.Physics.Arcade.StaticGroup>
}