import {ChangeDirection} from "gotchiminer-multiplayer-protocol";
import Config from "../../../Config";
import * as Schema from "../../../Rooms/shared/schemas"
import ClientWrapper from "../../Objects/ClientWrapper";
import Player from "../../Objects/Player";
import PlayerExcavationManager from "../PlayerExcavationManager";
import { DefaultSkills } from "../PlayerSkillManager";
import { DefaultVitals, PlayerVital } from "../PlayerVitalsManager";


export default class PlayerMovementManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player, client: ClientWrapper) {
        super(scene, "PlayerMovementManager")
        scene.add.existing(this)
        this.player = player
        this.lastDirection = new ChangeDirection()
        this.lastBlockPosition = new Phaser.Geom.Point()
        this.excavationManager = new PlayerExcavationManager(scene, player)
        //Register message handler
        client.messageRouter.addRoute(ChangeDirection, this.handleChangeDirection.bind(this))
        //Set maximum speed
        if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.excavationManager.isDrilling()) {
            this.player.body.setMaxVelocityX(this.player.skillManager().get(DefaultSkills.MOVING_SPEED).value() * Config.blockWidth)
            this.player.body.setMaxVelocityY(this.player.skillManager().get(DefaultSkills.FLYING_SPEED).value() * Config.blockHeight) 
        }
    }

    public moveToSurface() {
        this.moveTween.stop()
        if(this.moveTween) this.scene.tweens.remove(this.moveTween)
        if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.excavationManager.isDrilling()) {
            this.player.setPosition(Math.random() * 10 * 300, -300)
            this.player.body.setVelocity(0, 0)
            this.player.body.setAcceleration(0, 0)
        }
    }

    public moveToLocation(x: number, y: number, duration: number) { 
        if(this.moveTween) this.scene.tweens.remove(this.moveTween)
        this.moveTween = this.scene.tweens.add({
            targets: this.player,
            y: y,
            x: x,
            duration: duration,
            ease: Phaser.Math.Easing.Linear,
            loop: 0,
        })
    }

    public blockPosition() : Phaser.Geom.Point {
        let currentLayer : number = this.player.y / Config.blockHeight
        let x : number = this.player.x / Config.blockWidth
        return new Phaser.Geom.Point(Math.floor(x), Math.floor(currentLayer))
    }

    private handleChangeDirection(direction : ChangeDirection) {
        this.lastDirection = direction
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        //Process fuel for previous action
        this.processFuelUsage(delta)
        //First, see if we are gonna drill
        this.excavationManager.processDirection(this.lastDirection)
        //Update playerstate
        this.updateMovementState()
        //Apply player movement
        this.applyUserInput()
        //Synchronize with schema
        this.syncWithSchema()
    }

    private applyUserInput() {
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            //Apply acceleration to player body
            if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.excavationManager.isDrilling()) {
                this.player.body.setAcceleration(this.lastDirection.x * this.player.skillManager().get(DefaultSkills.MOVING_SPEED).value() * Config.blockWidth, 
                (this.lastDirection.y < 0) ? this.lastDirection.y * this.player.skillManager().get(DefaultSkills.FLYING_SPEED_ACCELLERATION).value() * Config.blockHeight : 600)
            }          
        }
    }

    private updateMovementState() {
        if(this.excavationManager.isDrilling()) this.player.playerSchema.playerState.movementState = Schema.MovementState.Drilling
        else if (this.lastDirection.y < 0) this.player.playerSchema.playerState.movementState = Schema.MovementState.Flying 
        else if (this.lastDirection.x != null) this.player.playerSchema.playerState.movementState = Schema.MovementState.Moving
        else this.player.playerSchema.playerState.movementState = Schema.MovementState.Stationary 
    }

    private processFuelUsage(duration : number) {
        switch(this.player.playerSchema.playerState.movementState) {
            case Schema.MovementState.Stationary:
                this.player.vitalsManager().get(DefaultVitals.FUEL).takeAmount(this.player.skillManager().get(DefaultSkills.STATIONARY_FUEL_USAGE).value() / 1000 * duration)
            break;
            case Schema.MovementState.Moving:
                this.player.vitalsManager().get(DefaultVitals.FUEL).takeAmount(this.player.skillManager().get(DefaultSkills.MOVING_FUEL_USAGE).value() / 1000 * duration)
            break;
            case Schema.MovementState.Flying:
                this.player.vitalsManager().get(DefaultVitals.FUEL).takeAmount(this.player.skillManager().get(DefaultSkills.FLYING_FUEL_USAGE).value() / 1000 * duration)
            break;
        }
    }

    
    protected syncWithSchema(): void {
        //Check if player's block position has changed
        let newBlockPosition : Phaser.Geom.Point = this.blockPosition()
        if(!Phaser.Geom.Point.Equals(this.lastBlockPosition, newBlockPosition)) {
            this.lastBlockPosition = newBlockPosition
            this.emit(PlayerMovementManager.BLOCK_POSITION_CHANGED, this.lastBlockPosition, newBlockPosition)
        }
        //Sync player position with colyseus schema
        if(this.player.playerSchema.playerState.x != Math.round(this.player.x * 100) / 100) this.player.playerSchema.playerState.x = Math.round(this.player.x * 100) / 100
        if(this.player.playerSchema.playerState.y != Math.round(this.player.y * 100) / 100) this.player.playerSchema.playerState.y = Math.round(this.player.y * 100) / 100
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            if(this.player.playerSchema.playerState.velocityX != this.body.velocity.x) this.player.playerSchema.playerState.velocityX = this.body.velocity.x
            if(this.player.playerSchema.playerState.velocityY != this.body.velocity.x) this.player.playerSchema.playerState.velocityY = this.body.velocity.y
        }
    }

    static readonly BLOCK_POSITION_CHANGED: unique symbol = Symbol();
    private lastBlockPosition : Phaser.Geom.Point
    private moveTween : Phaser.Tweens.Tween
    public excavationManager : PlayerExcavationManager
    private lastDirection : ChangeDirection
    private player : Player
}