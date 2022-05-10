import * as Chisel from "chisel-api-interface";
import { SpawnType, World } from "chisel-api-interface";
import { ChangeDirection } from "gotchiminer-multiplayer-protocol";
import { Scene } from "phaser";
import Config from "../../../../Config";
import * as Schema from "../../../../Schemas";
import { CargoEntry } from "../../../../Schemas";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import Player from "../../../Objects/Player";
import MainScene from "../../../Scenes/MainScene";
import BlockManager from "../../World/BlockManager";
import { DefaultSkills } from "../PlayerSkillManager";
import { DefaultVitals } from "../PlayerVitalsManager";
import { DefaultStatistics } from "../PlayerStatisticsManager";
import { BlockInterface } from "../../../Helpers/BlockSchemaWrapper";
export default class PlayerExcavationManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerExcavationManager")
        //Fetch blockmanager from scene
        if(scene instanceof MainScene) {
            this.blockManager = scene.blockManager
            this.worldInfo = scene.worldInfo
        }
        this.player = player

        this.soilMap = new Map<number, Chisel.Soil>()
        this.worldInfo.soil.forEach(soil => {
            this.soilMap.set(soil.id, soil)
        }, this);

        this.rockMap = new Map<number, Chisel.Rock>()
        this.worldInfo.rocks.forEach(rock => {
            this.rockMap.set(rock.id, rock)
        })
        scene.add.existing(this)
        this.drilling = false;
    }

    protected drillDirectionFromChangeDirection(direction : ChangeDirection) : Schema.MovementDirection {
        if (direction.x > 0) return Schema.MovementDirection.Right
        else if (direction.x < 0) return Schema.MovementDirection.Left
        else if(direction.y > 0) return Schema.MovementDirection.Down
        else return Schema.MovementDirection.None
    }

    protected blockExistsInDiretion(drillingDirection : Schema.MovementDirection) : boolean {
        let targetBlock : BlockInterface | undefined = this.blockInDirectionRelativeToPlayer(drillingDirection)
        if(!targetBlock) return false
        if(targetBlock.spawnType == Chisel.SpawnType.None) return false
        return true
    }

    protected blockInDirectionRelativeToPlayer(drillingDirection : Schema.MovementDirection) : BlockInterface | undefined {
        let targetPosition : Phaser.Geom.Point = this.targetBlockPosition(drillingDirection)
        switch(drillingDirection) {
            case Schema.MovementDirection.Down:
                return this.blockManager.blockAt(targetPosition.x, targetPosition.y)
            case Schema.MovementDirection.Left:
                return this.blockManager.blockAt(targetPosition.x, targetPosition.y)
            case Schema.MovementDirection.Right:
                return this.blockManager.blockAt(targetPosition.x, targetPosition.y)
        }
    }

    protected targetBlockPosition(drillingDirection : Schema.MovementDirection) : Phaser.Geom.Point {
        let playerPosition : Phaser.Geom.Point = this.player.movementManager().blockPosition()
        switch(drillingDirection) {
            case Schema.MovementDirection.Down:
                return new Phaser.Geom.Point(playerPosition.x, playerPosition.y+1)
            case Schema.MovementDirection.Left:
                return new Phaser.Geom.Point(playerPosition.x-1, playerPosition.y)
            case Schema.MovementDirection.Right:
                return new Phaser.Geom.Point(playerPosition.x+1, playerPosition.y)
        }
    }

    protected canDrillInDirection(direction : Schema.MovementDirection) : boolean {
        //Check if there actually is a block below the player
        let blockBelowPlayer : BlockInterface | undefined = this.blockManager.blockAt(this.player.movementManager().blockPosition().x, this.player.movementManager().blockPosition().y+1)
        if(!blockBelowPlayer) return false
        if(blockBelowPlayer.spawnType == Chisel.SpawnType.None) return false


        //Check if there is a block to drill in the direction we want to drill
        if(!this.blockExistsInDiretion(direction)) return false
        //Check if the target block is not a rock, if so check if we can drill into the block
        let targetBlock : BlockInterface = this.blockInDirectionRelativeToPlayer(direction)
        if(targetBlock.spawnType == Chisel.SpawnType.Rock) {
            let rockType : Chisel.Rock = this.rockMap.get(targetBlock.spawnID)
            if (!(rockType.digable || rockType.lava)) return false
        }
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            //Player can only drill if resting on floor
            if(!this.player.body.onFloor()) return false
            //Player can only start drilling if not moving too fast
            if(this.player.body.velocity.length() > 100) return false
        }
        return true
    }

    public isDrilling() : boolean {
        return this.drilling
    }

    public cancelDrilling() {
        //Cancel block timeout
        clearTimeout(this.digTimeout)
        //Enable updates on the body
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.enable = true
        }
        this.drilling = false
    }

    protected drillInDirection(drillingDirection : Schema.MovementDirection) {
        //Find target block
        let targetBlock : BlockInterface | undefined = this.blockInDirectionRelativeToPlayer(drillingDirection)
        if(targetBlock) {
            //Find soil type and calculate drillduration using skills
            let digMultiplier : number = 1
            let targetSoil : Chisel.Soil | undefined = this.soilMap.get(targetBlock.soilID)
            if(targetSoil) digMultiplier = targetSoil.dig_multiplier
            let drillDuration : number = 1000 / this.player.skillManager().get(DefaultSkills.DIGGING_SPEED).value() * digMultiplier
            //Disable updates on body
            if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
                this.player.body.enable = false
            } 
            var self = this
            this.drilling = true;
            //Move player to block position
            let targetBlockPosition : Phaser.Geom.Point = this.targetBlockPosition(drillingDirection)
            let movementTween : Phaser.Tweens.Tween = this.player.movementManager().moveToLocation(targetBlockPosition.x * Config.blockWidth + Config.blockWidth/2, targetBlockPosition.y * Config.blockHeight + Config.blockHeight/2, drillDuration)

            //Remove block when digging is complete
            movementTween.on(Phaser.Tweens.Events.TWEEN_COMPLETE, function() {
                //Emit event
                self.emit(PlayerExcavationManager.BLOCK_MINED, targetBlock);
                //Process block on player inventory manager
                if(self.player.cargoManager().processBlock(targetBlock)) {
                    //Notify the client that a block has been minted
                    if(targetBlock.spawnType == Chisel.SpawnType.Crypto) {
                        let cryptoMinedMessage : Protocol.NotifyPlayerMinedCrypto = new Protocol.NotifyPlayerMinedCrypto()
                        cryptoMinedMessage.cryptoId = targetBlock.spawnID
                        let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(cryptoMinedMessage)
                        self.player.client().client.send(serializedMessage.name, serializedMessage.data)
                    }
                }else if(targetBlock.spawnType == SpawnType.Rock) {
                    //If digging lava, take some health and notify client
                   if(self.rockMap.get(targetBlock.spawnID).lava) {
                       let lavaMinedMessage : Protocol.NotifyPlayerMinedLava = new Protocol.NotifyPlayerMinedLava()
                       let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(lavaMinedMessage)
                       self.player.client().client.send(serializedMessage.name, serializedMessage.data)
                       self.player.vitalsManager().get(DefaultVitals.HEALTH).takeAmount(25)
                   }
                }
                //Stop movement on body
                if(self.player.body instanceof Phaser.Physics.Arcade.Body) {
                    self.player.body.enable = true
                }
                targetBlock.spawnType = Chisel.SpawnType.None
                self.blockManager.updateBlockAt(targetBlockPosition.x, targetBlockPosition.y, targetBlock)
                self .drilling = false
            }, )        

            //Take some fuel
            this.player.vitalsManager().get(DefaultVitals.FUEL).takeAmount(this.player.skillManager().get(DefaultSkills.DIGGING_FUEL_USAGE).value() * digMultiplier)
            //Update drilling time
        }
    }

    public getDrillDirection() : Schema.MovementDirection {
        return this.drillDirection;
    }

    public processDirection(direction : ChangeDirection) {
        if(!this.isDrilling()) {
            //Get drilling direction
            this.drillDirection = this.drillDirectionFromChangeDirection(direction)
            if(this.drillDirection != Schema.MovementDirection.None) {
                //Check if player can drill right now
                if(this.canDrillInDirection(this.drillDirection) && !this.isDrilling()) {
                    //If we can drill, drill (H)
                    this.drillInDirection(this.drillDirection)
                } 
            }        
        }
    }

    static readonly BLOCK_MINED: unique symbol = Symbol();
    private drillDirection : Schema.MovementDirection
    private drilling : boolean
    private digTimeout : NodeJS.Timeout
    private rockMap : Map<number, Chisel.Rock>
    private soilMap : Map<number, Chisel.Soil>
    private worldInfo : Chisel.DetailedWorld
    private blockManager : BlockManager
    private player : Player
}