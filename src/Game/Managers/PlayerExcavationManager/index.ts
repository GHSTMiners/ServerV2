import { SpawnType } from "chisel-api-interface";
import { ChangeDirection } from "gotchiminer-multiplayer-protocol";
import { Scene } from "phaser";
import Config from "../../../Config";
import * as Schema from "../../../Rooms/shared/schemas/Schemas";

import Player from "../../Objects/Player";
import MainScene from "../../Scenes/MainScene";
import BlockManager from "../BlockManager";
export default class PlayerExcavationManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerExcavationManager")
        //Fetch blockmanager from scene
        if(scene instanceof MainScene) {
            this.blockManager = scene.blockManager
        }
        this.nextDrillTime = Date.now()
        this.player = player
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
        if(targetBlock.spawnType == SpawnType.None) return false
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
        let playerPosition : Phaser.Geom.Point = this.player.blockPosition()
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
        let blockBelowPlayer : Schema.Block | undefined =  this.blockManager.blockAt(this.player.blockPosition().x, this.player.blockPosition().y+1)
        if(!blockBelowPlayer) return false
        if(blockBelowPlayer.spawnType == SpawnType.None) return false
        //Check if there is a block to drill in the direction we want to drill
        if(!this.blockExistsInDiretion(direction)) return false
        //Check if the target block is not a rock
        if(this.blockInDirectionRelativeToPlayer(direction).spawnType == SpawnType.Rock) return false
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

    protected drillInDirection(drillingDirection : Schema.DrillingDirection) {
        //Calculate drillduration
        let drillDuration : number = 200
        //Mint block
        let targetBlock : Schema.Block | undefined = this.blockInDirectionRelativeToPlayer(drillingDirection)
        setTimeout(function() {
            targetBlock.spawnType = SpawnType.None
        }, drillDuration)        
        //Move player to block position
        let targetBlockPosition : Phaser.Geom.Point = this.targetBlockPosition(drillingDirection)
        this.player.moveToLocation(targetBlockPosition.x * Config.blockWidth + Config.blockWidth/2, targetBlockPosition.y * Config.blockHeight + Config.blockHeight/2, drillDuration)
        //Update drilling time
        this.nextDrillTime = Date.now() + drillDuration
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

    private blockManager : BlockManager
    private nextDrillTime : number
    private player : Player
}