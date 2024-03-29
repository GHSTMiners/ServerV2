import Config from "../../../Config";
import * as Schema from "../../../Schemas";
import Player from "../Player";

export default class Explosive extends Phaser.GameObjects.Rectangle {
    constructor(scene : Phaser.Scene, explosiveSchema : Schema.Explosive, owner : Player) {
        super(scene, explosiveSchema.x, explosiveSchema.y)
        this.owner = owner
        this.explosiveSchema = explosiveSchema
        this.lastBlockPosition = new Phaser.Geom.Point()
        //Create a body for the rectangle
        this.scene.physics.add.existing(this, false)
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setCollideWorldBounds(true)
            this.body.x = explosiveSchema.x;
            this.body.y = explosiveSchema.y;
            this.body.setDrag(0.0075, 0.0075)
            this.body.setDamping(true)
            this.body.setAccelerationY(Config.gravity)
            this.body.setBounce(0.2, 0.2)
            this.body.setSize(Config.blockWidth * 0.75, Config.blockHeight * 0.75)
        }
        //Start the explosive timer
        this.scene.time.delayedCall(Config.explosiveTimeout, this.timerExpired.bind(this))
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        this.syncWithSchema()
    }

    public blockPosition() : Phaser.Geom.Point {
        let currentLayer : number = this.y / Config.blockHeight
        let x : number = this.x / Config.blockWidth
        return new Phaser.Geom.Point(Math.floor(x), Math.floor(currentLayer))
    }

    private timerExpired() {
        //Notify all clients about the explosion
        this.emit(Explosive.EXPLODED, this)
        this.destroy()
    }

    protected syncWithSchema(): void {
        //Check if player's block position has changed
        let newBlockPosition : Phaser.Geom.Point = this.blockPosition()
        if(!Phaser.Geom.Point.Equals(this.lastBlockPosition, newBlockPosition)) {
            this.lastBlockPosition = newBlockPosition
            this.emit(Explosive.BLOCK_POSITION_CHANGED, this.lastBlockPosition, newBlockPosition)
        }
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            this.explosiveSchema.x = this.body.x
            this.explosiveSchema.y = this.body.y
        }
    }
    
    public readonly owner : Player
    public explosiveSchema : Schema.Explosive
    static readonly EXPLODED: unique symbol = Symbol();
    static readonly BLOCK_POSITION_CHANGED: unique symbol = Symbol();
    private lastBlockPosition : Phaser.Geom.Point
}