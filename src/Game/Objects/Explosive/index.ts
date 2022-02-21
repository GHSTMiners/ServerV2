import Config from "../../../Config";
import * as Schema from "../../../Rooms/shared/schemas";
import { AavegotchiTraits } from "../../Helpers/AavegotchiInfoFetcher";
import PlayerBuildingManager from "../../Managers/PlayerBuildingManager";
import PlayerCargoManager from "../../Managers/PlayerCargoManager";
import PlayerMovementManager from "../../Managers/PlayerMovementManager";
import PlayerSkillManager from "../../Managers/PlayerSkillManager";
import PlayerVitalsManager, { DefaultVitals, PlayerVital } from "../../Managers/PlayerVitalsManager";
import ClientWrapper from "../ClientWrapper";

export default class Explosive extends Phaser.GameObjects.Rectangle {
    constructor(scene : Phaser.Scene, explosiveSchema : Schema.Explosive) {
        super(scene, explosiveSchema.x, explosiveSchema.y)
        this.explosiveSchema = explosiveSchema
        //Create a body for the rectangle
        this.scene.physics.add.existing(this, false)
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setCollideWorldBounds(true)
            this.body.x = explosiveSchema.x;
            this.body.y = explosiveSchema.y;
            this.body.setDamping(true)
            this.body.setVelocityY(-Config.gravity)
            this.body.setBounce(0.2, 0.2)
            this.body.setSize(Config.blockWidth * 0.50, Config.blockHeight * 0.50)
        }
        //Start the explosive timer
        this.scene.time.delayedCall(Config.explosiveTimeout, this.timerExpired.bind(this))
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        this.syncWithSchema()
    }

    private timerExpired() {
        //Notify all clients about the explosion
        this.emit(Explosive.EXPLODED, this)
        this.destroy()
    }

    protected syncWithSchema(): void {
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            this.explosiveSchema.x = this.body.x
            this.explosiveSchema.y = this.body.y
        }
    }
    
    public explosiveSchema : Schema.Explosive
    static readonly EXPLODED: unique symbol = Symbol();
}