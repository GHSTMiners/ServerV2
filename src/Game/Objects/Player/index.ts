import { ChangeDirection } from "gotchiminer-multiplayer-protocol";
import Config from "../../../Config";
import * as Schema from "../../../Rooms/shared/schemas/Player";
import ClientWrapper from "../ClientWrapper";

export default class Player extends Phaser.GameObjects.Rectangle {
    
    constructor(scene : Phaser.Scene, playerSchema : Schema.Player, client: ClientWrapper) {
        super(scene, playerSchema.x, playerSchema.y)
        this.playerSchema = playerSchema
        this.lastBlockPosition = new Phaser.Geom.Point()
        //Create a body for the rectangle
        this.scene.physics.add.existing(this, false)
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setCollideWorldBounds(true)
            this.body.x = playerSchema.x;
            this.body.y = playerSchema.y;
            this.body.setMaxVelocity(2500, 2500)
            this.body.setDamping(true)
            this.body.setBounce(0.2, 0.2)
            this.body.setDrag(0.01, 0.01)
        }
        
        //Register message handler
        client.messageRouter.addRoute(ChangeDirection, this.handleChangeDirection.bind(this))
        //Configure size and position
        this.setPosition(playerSchema.x, playerSchema.y)
        this.setSize(Config.blockWidth*0.85, Config.blockWidth)
        //Start moving
        this.handleChangeDirection(new ChangeDirection())
    }

    private handleChangeDirection(direction : ChangeDirection) {
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setAcceleration(direction.x *400, (direction.y < 0) ? direction.y * 400 : 600)
        }
    }

    public blockPosition() : Phaser.Geom.Point {
        let currentLayer : number = this.y / Config.blockHeight
        let x : number = this.x / Config.blockWidth
        return new Phaser.Geom.Point(Math.floor(x), Math.floor(currentLayer))
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        //Check if player's block position has changed
        let newBlockPosition : Phaser.Geom.Point = this.blockPosition()
        if(!Phaser.Geom.Point.Equals(this.lastBlockPosition, newBlockPosition)) {
            this.lastBlockPosition = newBlockPosition
            this.emit(Player.BLOCK_POSITION_CHANGED, newBlockPosition)
        }
        //Sync player position with colyseus schema
        if(this.playerSchema.x != this.x) this.playerSchema.x = this.x
        if(this.playerSchema.y != this.y) this.playerSchema.y = this.y
    }

    private lastBlockPosition : Phaser.Geom.Point
    public readonly playerSchema : Schema.Player
    static readonly BLOCK_POSITION_CHANGED: unique symbol = Symbol();

}