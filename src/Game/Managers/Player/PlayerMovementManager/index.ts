import {ChangeDirection} from "gotchiminer-multiplayer-protocol";
import Config from "../../../../Config";
import * as Schema from "../../../../Schemas"
import ClientWrapper from "../../../../Helpers/ClientWrapper";
import Player from "../../../Objects/Player";
import PlayerExcavationManager from "../PlayerExcavationManager";
import { DefaultSkills } from "../PlayerSkillManager";
import { DefaultVitals, PlayerVital } from "../PlayerVitalsManager";
import MainScene from "../../../Scenes/MainScene";
import { DefaultStatistics } from "../PlayerStatisticsManager";


export default class PlayerMovementManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerMovementManager")
        scene.add.existing(this)
        this.player = player
        this.lastDirection = new ChangeDirection()
        this.lastBlockPosition = new Phaser.Geom.Point()
        this.m_excavationManager = new PlayerExcavationManager(scene, player)
        //Register message handler
        player.client().messageRouter.addRoute(ChangeDirection, this.handleChangeDirection.bind(this))
        //Set maximum speed
        if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.m_excavationManager.isDrilling()) {
            this.player.body.setMaxVelocityX(this.player.skillManager().get(DefaultSkills.MOVING_SPEED).value() * Config.blockWidth)
            this.player.body.setMaxVelocityY(this.player.skillManager().get(DefaultSkills.FLYING_SPEED).value() * Config.blockHeight) 
        }
    }

    public moveToNearestPortal() {
        if(this.moveTween) this.moveTween.stop()
        if(this.moveTween) this.scene.tweens.remove(this.moveTween)
        if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.m_excavationManager.isDrilling()) {
            let nearestPortalBlockPosition : Phaser.Geom.Point = this.player.buildingManager().nearestSpawnPortal()
            let nearestPortalPosition : Phaser.Geom.Point = new Phaser.Geom.Point(Config.blockWidth * (nearestPortalBlockPosition.x-0.5), Config.blockHeight * (nearestPortalBlockPosition.y-1))
            this.player.setPosition(nearestPortalPosition.x, nearestPortalPosition.y)
            this.player.body.setVelocity(0, 0)
            this.player.body.setAcceleration(0, 0)
        }
    }

    public moveToSurface() {
        if(this.moveTween) this.moveTween.stop()
        if(this.moveTween) this.scene.tweens.remove(this.moveTween)
        if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.m_excavationManager.isDrilling()) {
            this.player.setPosition(Math.random() * 10 * 300, -300)
            this.player.body.setVelocity(0, 0)
            this.player.body.setAcceleration(0, 0)
        }
    }

    public moveToLocation(x: number, y: number, duration: number) : Phaser.Tweens.Tween { 
        this.moveTween = this.scene.tweens.add({
            targets: this.player,
            y: y,
            x: x,
            duration: duration,
            ease: Phaser.Math.Easing.Linear,
            loop: 0,
        })
        this.moveTween.on(Phaser.Tweens.Events.TWEEN_COMPLETE, () => {
            if(this.moveTween) this.scene.tweens.remove(this.moveTween)
        }, this);
        return this.moveTween
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
        this.m_excavationManager.processDirection(this.lastDirection)
        //Update playerstate
        this.updateMovementState()
        //Apply player movement
        this.applyUserInput()
        //Process statistics
        this.updateStatistics()
        //Synchronize with schema
        this.syncWithSchema()

    }

    private applyUserInput() {
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            //Apply acceleration to player body
            if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.m_excavationManager.isDrilling()) {
                this.player.body.setAcceleration(Phaser.Math.Clamp(this.lastDirection.x, -1, 1) * this.player.skillManager().get(DefaultSkills.MOVING_SPEED).value() * Config.blockWidth, 
                (this.lastDirection.y < 0) ? Phaser.Math.Clamp(this.lastDirection.y, -1, 0) * this.player.skillManager().get(DefaultSkills.FLYING_SPEED_ACCELLERATION).value() * Config.blockHeight : Config.gravity)
            }          
        }
    }

    private updateMovementState() {
        if(this.m_excavationManager.isDrilling()) this.player.playerSchema.playerState.movementState = Schema.MovementState.Drilling
        else if (this.lastDirection.y < 0) this.player.playerSchema.playerState.movementState = Schema.MovementState.Flying 
        else if (this.lastDirection.x != null) this.player.playerSchema.playerState.movementState = Schema.MovementState.Moving
        else this.player.playerSchema.playerState.movementState = Schema.MovementState.Stationary 
    }

    public excavationManager() : PlayerExcavationManager {
        return this.m_excavationManager;
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

    protected updateStatistics(): void {
        this.player.statisticsManager().addAmount(DefaultStatistics.TRAVELED_DISTANCE, 
            Phaser.Math.Distance.Between(this.player.playerSchema.playerState.x, this.player.playerSchema.playerState.y, this.player.x, this.player.y))
    }
    
    protected syncWithSchema(): void {
        //Sync drilldirection
        if(this.m_excavationManager.isDrilling()) {
            this.player.playerSchema.playerState.movementDirection = this.m_excavationManager.getDrillDirection() 
        } else {
            if (this.lastDirection.x < 0) this.player.playerSchema.playerState.movementDirection = Schema.MovementDirection.Left 
            else if (this.lastDirection.x > 0) this.player.playerSchema.playerState.movementDirection = Schema.MovementDirection.Right
            else this.player.playerSchema.playerState.movementDirection = Schema.MovementDirection.None
        }
        //Check if player's block position has changed
        let newBlockPosition : Phaser.Geom.Point = this.blockPosition()
        if(!Phaser.Geom.Point.Equals(this.lastBlockPosition, newBlockPosition)) {
            this.lastBlockPosition = newBlockPosition
            this.emit(PlayerMovementManager.BLOCK_POSITION_CHANGED, this.lastBlockPosition, newBlockPosition)
        }
        //Sync player position with colyseus schema
        if(this.player.playerSchema.playerState.x != Math.round(this.player.x * 100) / 100) this.player.playerSchema.playerState.x = Math.round(this.player.x * 100) / 100
        if(this.player.playerSchema.playerState.y != Math.round(this.player.y * 100) / 100) this.player.playerSchema.playerState.y = Math.round(this.player.y * 100) / 100
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            if(this.player.playerSchema.playerState.velocityX != this.player.body.velocity.x) this.player.playerSchema.playerState.velocityX = this.player.body.velocity.x
            if(this.player.playerSchema.playerState.velocityY != this.player.body.velocity.x) this.player.playerSchema.playerState.velocityY = this.player.body.velocity.y
        }
    }

    static readonly BLOCK_POSITION_CHANGED: unique symbol = Symbol();
    private lastBlockPosition : Phaser.Geom.Point
    private moveTween : Phaser.Tweens.Tween
    public m_excavationManager : PlayerExcavationManager
    private lastDirection : ChangeDirection
    private player : Player
}