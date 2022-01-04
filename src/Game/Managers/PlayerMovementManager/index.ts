import {ChangeDirection} from "gotchiminer-multiplayer-protocol";
import { PlayerState } from "../../../Rooms/shared/schemas/Player";
import ClientWrapper from "../../Objects/ClientWrapper";
import Player from "../../Objects/Player";


export default class PlayerMovementManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player, client: ClientWrapper) {
        super(scene, "PlayerMovementManager")
        scene.add.existing(this)
        this.player = player
        this.lastDirection = new ChangeDirection()
        //Register message handler
        client.messageRouter.addRoute(ChangeDirection, this.handleChangeDirection.bind(this))
    }

    private handleChangeDirection(direction : ChangeDirection) {
        this.lastDirection = direction
        //Apply acceleration to player body
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.setAcceleration(direction.x *400, (direction.y < 0) ? direction.y * 400 : 600)
        }
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        if(this.player.body instanceof Phaser.Physics.Arcade.Body) {
            //Update playerstate
            if(this.lastDirection.y > 0 && this.player.body.onFloor()) this.player.playerSchema.playerState = PlayerState.Drilling
            else if (this.lastDirection.y < 0) this.player.playerSchema.playerState = PlayerState.Flying 
            else if (this.lastDirection.x != null) this.player.playerSchema.playerState = PlayerState.Moving
            else this.player.playerSchema.playerState = PlayerState.Stationary            
        }
    }

    private lastDirection : ChangeDirection
    private player : Player
}