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
        this.excavationManager = new PlayerExcavationManager(scene, player)
        //Register message handler
        client.messageRouter.addRoute(ChangeDirection, this.handleChangeDirection.bind(this))
        //Set maximum speed
        if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.excavationManager.isDrilling()) {
            this.player.body.setMaxVelocityX(this.player.skillManager.get(DefaultSkills.MOVING_SPEED).value() * Config.blockWidth)
            this.player.body.setMaxVelocityY(this.player.skillManager.get(DefaultSkills.FLYING_SPEED).value() * Config.blockHeight) 
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

    private handleChangeDirection(direction : ChangeDirection) {
        this.lastDirection = direction
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        //Process fuel for previous action
        switch(this.player.playerSchema.playerState.movementState) {
            case Schema.MovementState.Stationary:
                this.player.vitalsManager.get(DefaultVitals.FUEL).takeAmount(this.player.skillManager.get(DefaultSkills.STATIONARY_FUEL_USAGE).value() / 1000 * delta)
            break;
            case Schema.MovementState.Moving:
                this.player.vitalsManager.get(DefaultVitals.FUEL).takeAmount(this.player.skillManager.get(DefaultSkills.MOVING_FUEL_USAGE).value() / 1000 * delta)
            break;
            case Schema.MovementState.Flying:
                this.player.vitalsManager.get(DefaultVitals.FUEL).takeAmount(this.player.skillManager.get(DefaultSkills.FLYING_FUEL_USAGE).value() / 1000 * delta)
            break;
        }
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            //First, see if we are gonna drill
            this.excavationManager.processDirection(this.lastDirection)
            //Update playerstate
            if(this.excavationManager.isDrilling()) this.player.playerSchema.playerState.movementState = Schema.MovementState.Drilling
            else if (this.lastDirection.y < 0) this.player.playerSchema.playerState.movementState = Schema.MovementState.Flying 
            else if (this.lastDirection.x != null) this.player.playerSchema.playerState.movementState = Schema.MovementState.Moving
            else this.player.playerSchema.playerState.movementState = Schema.MovementState.Stationary 
            //Apply acceleration to player body
            if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.excavationManager.isDrilling()) {
                this.player.body.setAcceleration(this.lastDirection.x * this.player.skillManager.get(DefaultSkills.MOVING_SPEED).value() * Config.blockWidth, 
                (this.lastDirection.y < 0) ? this.lastDirection.y * this.player.skillManager.get(DefaultSkills.FLYING_SPEED_ACCELLERATION).value() * Config.blockHeight : 600)
            }          
        }
    }

    private moveTween : Phaser.Tweens.Tween
    public excavationManager : PlayerExcavationManager
    private lastDirection : ChangeDirection
    private player : Player
}