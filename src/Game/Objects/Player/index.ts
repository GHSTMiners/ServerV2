import { ChangeDirection } from "gotchiminer-multiplayer-protocol";
import * as Schema from "../../../Rooms/shared/schemas/Player";
import ClientWrapper from "../ClientWrapper";

export default class Player extends Phaser.GameObjects.Rectangle {
    constructor(scene : Phaser.Scene, playerSchema : Schema.Player, client: ClientWrapper) {
        super(scene, 0, 0)
        this.playerSchema = playerSchema
        //Create a body for the rectangle
        this.scene.physics.add.existing(this, false)
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setCollideWorldBounds(true)
        }
        //Register message handler
        client.messageRouter.addRoute(ChangeDirection, this.handleChangeDirection.bind(this))
        //Register post update handler
        this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE,
            this.syncWithSchema.bind(this))
        //Configure size and position
        this.setPosition(playerSchema.x, playerSchema.y)
        this.setSize(128*0.85, 128)
    }

    private handleChangeDirection(direction : ChangeDirection) {
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setAcceleration(direction.x *400, (direction.y < 0) ? direction.y * 400 : 600)
        }
    }

    private syncWithSchema() {
        this.playerSchema.x = this.x
        this.playerSchema.y = this.y
    }

    public readonly playerSchema : Schema.Player
}