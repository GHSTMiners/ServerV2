import * as Chisel from "chisel-api-interface";
import { SpawnType, World } from "chisel-api-interface";
import { ChangeDirection } from "gotchiminer-multiplayer-protocol";
import { Scene } from "phaser";
import Config from "../../../Config";
import * as Schema from "../../../Rooms/shared/schemas";
import { CargoEntry } from "../../../Rooms/shared/schemas";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import Player from "../../Objects/Player";
import MainScene from "../../Scenes/MainScene";
import BlockManager from "../BlockManager";
import { DefaultSkills } from "../PlayerSkillManager";
import { DefaultVitals } from "../PlayerVitalsManager";
export default class PlayerExcavationManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerExcavationManager")
        //Fetch blockmanager from scene
        if(scene instanceof MainScene) {
            this.blockManager = scene.blockManager
            this.worldInfo = scene.worldInfo
        }
        this.nextDrillTime = Date.now()
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
    }

    protected drillDirectionFromChangeDirection(direction : ChangeDirection) : Schema.DrillingDirection {
        if (direction.x > 0) return Schema.DrillingDirection.Right
        else if (direction.x < 0) return Schema.DrillingDirection.Left
        else if(direction.y > 0) return Schema.DrillingDirection.Down
        else return Schema.DrillingDirection.None
    }

    protected blockExistsInDiretion(drillingDirection : Schema.DrillingDirection) : boolean {
        let targetBlock : Schema.Block | undefined = this.blockInDirectionRelativeToPlayer(drillingDirection)
        if(!targetBlock) return false
        if(targetBlock.spawnType == Chisel.SpawnType.None) return false
        return true
    }

    protected blockInDirectionRelativeToPlayer(drillingDirection : Schema.DrillingDirection) : Schema.Block | undefined {
        let targetPosition : Phaser.Geom.Point = this.targetBlockPosition(drillingDirection)
        switch(drillingDirection) {
            case Schema.DrillingDirection.Down:
                return this.blockManager.blockAt(targetPosition.x, targetPosition.y)
            case Schema.DrillingDirection.Left:
                return this.blockManager.blockAt(targetPosition.x, targetPosition.y)
            case Schema.DrillingDirection.Right:
                return this.blockManager.blockAt(targetPosition.x, targetPosition.y)
        }
    }

    protected targetBlockPosition(drillingDirection : Schema.DrillingDirection) : Phaser.Geom.Point {
        let playerPosition : Phaser.Geom.Point = this.player.movementManager().blockPosition()
        switch(drillingDirection) {
            case Schema.DrillingDirection.Down:
                return new Phaser.Geom.Point(playerPosition.x, playerPosition.y+1)
            case Schema.DrillingDirection.Left:
                return new Phaser.Geom.Point(playerPosition.x-1, playerPosition.y)
            case Schema.DrillingDirection.Right:
                return new Phaser.Geom.Point(playerPosition.x+1, playerPosition.y)
        }
    }

    protected canDrillInDirection(direction : Schema.DrillingDirection) : boolean {
        //Check if there actually is a block below the player
        let blockBelowPlayer : Schema.Block | undefined =  this.blockManager.blockAt(this.player.movementManager().blockPosition().x, this.player.movementManager().blockPosition().y+1)
        if(!blockBelowPlayer) return false
        if(blockBelowPlayer.spawnType == Chisel.SpawnType.None) return false
        //Check if there is a block to drill in the direction we want to drill
        if(!this.blockExistsInDiretion(direction)) return false
        //Check if the target block is not a rock, if so check if we can drill into the block
        let targetBlock : Schema.Block = this.blockInDirectionRelativeToPlayer(direction)
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
        return this.nextDrillTime > Date.now()
    }

    public cancelDrilling() {
        //Cancel block timeout
        clearTimeout(this.digTimeout)
        //Enable updates on the body
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.enable = true
        }
        this.nextDrillTime = Date.now()
    }

    protected drillInDirection(drillingDirection : Schema.DrillingDirection) {
        //Find target block
        let targetBlock : Schema.Block | undefined = this.blockInDirectionRelativeToPlayer(drillingDirection)
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
            //Remove block when digging is complete
            this.digTimeout = setTimeout(function(player : Player) {
                //Process block on player inventory manager
                if(player.cargoManager().processBlock(targetBlock)) {
                    //Notify the client that a block has been minted
                    if(targetBlock.spawnType == Chisel.SpawnType.Crypto) {
                        let cryptoMinedMessage : Protocol.NotifyPlayerMinedCrypto = new Protocol.NotifyPlayerMinedCrypto()
                        cryptoMinedMessage.cryptoId = targetBlock.spawnID
                        let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(cryptoMinedMessage)
                        player.client().client.send(serializedMessage.name, serializedMessage.data)
                    }
                }else if(targetBlock.spawnType == SpawnType.Rock) {
                    //If digging lava, take some health and notify client
                   if(self.rockMap.get(targetBlock.spawnID).lava) {
                       let lavaMinedMessage : Protocol.NotifyPlayerMinedLava = new Protocol.NotifyPlayerMinedLava()
                       let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(lavaMinedMessage)
                       player.client().client.send(serializedMessage.name, serializedMessage.data)
                       player.vitalsManager().get(DefaultVitals.HEALTH).takeAmount(25)
                   }
                }
                //Stop movement on body
                if(player.body instanceof Phaser.Physics.Arcade.Body) {
                    player.body.enable = true
                }
                targetBlock.spawnType = Chisel.SpawnType.None
            }, drillDuration-10, this.player)        
            //Move player to block position
            let targetBlockPosition : Phaser.Geom.Point = this.targetBlockPosition(drillingDirection)
            this.player.movementManager().moveToLocation(targetBlockPosition.x * Config.blockWidth + Config.blockWidth/2, targetBlockPosition.y * Config.blockHeight + Config.blockHeight/2, drillDuration)
            //Take some fuel
            this.player.vitalsManager().get(DefaultVitals.FUEL).takeAmount(this.player.skillManager().get(DefaultSkills.DIGGING_FUEL_USAGE).value() * digMultiplier)
            //Update drilling time
            this.nextDrillTime = Date.now() + drillDuration
        }
    }

    public processDirection(direction : ChangeDirection) {
        //Get drilling direction
        let drillDirection : Schema.DrillingDirection = this.drillDirectionFromChangeDirection(direction)
        if(drillDirection != Schema.DrillingDirection.None) {
            //Check if player can drill right now
            if(this.canDrillInDirection(drillDirection) && !this.isDrilling()) {
                //If we can drill, drill (H)
                this.drillInDirection(drillDirection)
            }
        }        
    }

    private digTimeout : NodeJS.Timeout
    private rockMap : Map<number, Chisel.Rock>
    private soilMap : Map<number, Chisel.Soil>
    private worldInfo : Chisel.DetailedWorld
    private blockManager : BlockManager
    private nextDrillTime : number
    private player : Player
}