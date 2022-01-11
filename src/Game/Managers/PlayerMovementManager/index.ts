import {ChangeDirection} from "gotchiminer-multiplayer-protocol";
import Config from "../../../Config";
import * as Schema from "../../../Rooms/shared/schemas"
import ClientWrapper from "../../Objects/ClientWrapper";
import Player from "../../Objects/Player";
import PlayerExcavationManager from "../PlayerExcavationManager";
import { DefaultSkills } from "../PlayerSkillManager";


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

    private handleChangeDirection(direction : ChangeDirection) {
        this.lastDirection = direction
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            //First, see if we are gonna drill
            this.excavationManager.processDirection(this.lastDirection)
            //Update playerstate
            if(this.excavationManager.isDrilling()) this.player.playerSchema.playerState = Schema.PlayerState.Drilling
            else if (this.lastDirection.y < 0) this.player.playerSchema.playerState = Schema.PlayerState.Flying 
            else if (this.lastDirection.x != null) this.player.playerSchema.playerState = Schema.PlayerState.Moving
            else this.player.playerSchema.playerState = Schema.PlayerState.Stationary 
            //Apply acceleration to player body
            if(this.player.body instanceof Phaser.Physics.Arcade.Body && !this.excavationManager.isDrilling()) {
                this.player.body.setAcceleration(this.lastDirection.x * this.player.skillManager.get(DefaultSkills.MOVING_SPEED).value() * Config.blockWidth, 
                (this.lastDirection.y < 0) ? this.lastDirection.y * this.player.skillManager.get(DefaultSkills.FLYING_SPEED_ACCELLERATION).value() * Config.blockHeight : 600)
            }          
        }
    }

    private excavationManager : PlayerExcavationManager
    private lastDirection : ChangeDirection
    private player : Player
}