import Config from "../../../Config";
import * as Schema from "../../../Rooms/shared/schemas/Player/Player";
import { AavegotchiTraits } from "../../Helpers/AavegotchiInfoFetcher";
import PlayerCargoManager from "../../Managers/PlayerCargoManager";
import PlayerMovementManager from "../../Managers/PlayerMovementManager";
import PlayerSkillManager from "../../Managers/PlayerSkillManager";
import ClientWrapper from "../ClientWrapper";

export default class Player extends Phaser.GameObjects.Rectangle {
    
    constructor(scene : Phaser.Scene, playerSchema : Schema.Player, traits : AavegotchiTraits, client: ClientWrapper) {
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
            this.body.setSize(Config.blockWidth*0.85, Config.blockHeight*0.90)
            this.body.setOffset(0, Config.blockHeight*0.1)
        }
        
        //Configure size and position
        this.setPosition(playerSchema.x, playerSchema.y)
        this.setSize(Config.blockWidth*0.5, Config.blockHeight)
        //Create managers
        this.skillManager = new PlayerSkillManager(scene, traits)
        this.movementManager = new PlayerMovementManager(scene, this, client)
        this.cargoManager = new PlayerCargoManager(scene, this)
    }

    public blockPosition() : Phaser.Geom.Point {
        let currentLayer : number = this.y / Config.blockHeight
        let x : number = this.x / Config.blockWidth
        return new Phaser.Geom.Point(Math.floor(x), Math.floor(currentLayer))
    }

    public moveToLocation(x: number, y: number, duration: number) { 
        if(this.moveTween) this.scene.tweens.remove(this.moveTween)
        this.moveTween = this.scene.tweens.add({
            targets: this,
            y: y,
            x: x,
            duration: duration,
            ease: Phaser.Math.Easing.Linear,
            loop: 0,
        })
    }

    public getCargoManager() : PlayerCargoManager {
        return this.cargoManager
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        if(willStep) {
            //Check if player's block position has changed
            let newBlockPosition : Phaser.Geom.Point = this.blockPosition()
            if(!Phaser.Geom.Point.Equals(this.lastBlockPosition, newBlockPosition)) {
                this.lastBlockPosition = newBlockPosition
                this.emit(Player.BLOCK_POSITION_CHANGED, newBlockPosition)
            }
            //Sync player position with colyseus schema
            if(this.playerSchema.x != Math.round(this.x * 100) / 100) this.playerSchema.x = Math.round(this.x * 100) / 100
            if(this.playerSchema.y != Math.round(this.y * 100) / 100) this.playerSchema.y = Math.round(this.y * 100) / 100
            if(this.body instanceof Phaser.Physics.Arcade.Body) {
                if(this.playerSchema.velocityX != this.body.velocity.x) this.playerSchema.velocityX = this.body.velocity.x
                if(this.playerSchema.velocityY != this.body.velocity.x) this.playerSchema.velocityY = this.body.velocity.y
            }
        }
    }

    private gotchiTraits : AavegotchiTraits
    public skillManager : PlayerSkillManager
    private cargoManager : PlayerCargoManager
    private movementManager : PlayerMovementManager
    private lastBlockPosition : Phaser.Geom.Point
    public readonly playerSchema : Schema.Player
    private moveTween : Phaser.Tweens.Tween
    static readonly BLOCK_POSITION_CHANGED: unique symbol = Symbol();

}