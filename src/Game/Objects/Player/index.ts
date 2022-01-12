import Config from "../../../Config";
import * as Schema from "../../../Rooms/shared/schemas/Player/Player";
import { AavegotchiTraits } from "../../Helpers/AavegotchiInfoFetcher";
import PlayerCargoManager from "../../Managers/PlayerCargoManager";
import PlayerMovementManager from "../../Managers/PlayerMovementManager";
import PlayerSkillManager from "../../Managers/PlayerSkillManager";
import PlayerVitalsManager, { DefaultVitals, PlayerVital } from "../../Managers/PlayerVitalsManager";
import ClientWrapper from "../ClientWrapper";

export default class Player extends Phaser.GameObjects.Rectangle {
    
    constructor(scene : Phaser.Scene, playerSchema : Schema.Player, traits : AavegotchiTraits, client: ClientWrapper) {
        super(scene, playerSchema.playerState.x, playerSchema.playerState.y)
        this.playerSchema = playerSchema
        this.lastBlockPosition = new Phaser.Geom.Point()
        //Create a body for the rectangle
        this.scene.physics.add.existing(this, false)
        if(this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setCollideWorldBounds(true)
            this.body.x = playerSchema.playerState.x;
            this.body.y = playerSchema.playerState.y;
            this.body.setMaxVelocity(2500, 2500)
            this.body.setDamping(true)
            this.body.setBounce(0.2, 0.2)
            this.body.setDrag(0.01, 0.01)
            this.body.setSize(Config.blockWidth*0.85, Config.blockHeight*0.90)
            this.body.setOffset(0, Config.blockHeight*0.1)
        }
        
        //Configure size and position
        this.setPosition(playerSchema.playerState.x, playerSchema.playerState.y)
        this.setSize(Config.blockWidth*0.5, Config.blockHeight)
        //Create managers
        this.vitalsManager = new PlayerVitalsManager(scene, traits, playerSchema)
        this.skillManager = new PlayerSkillManager(scene, traits, playerSchema)
        this.movementManager = new PlayerMovementManager(scene, this, client)
        this.cargoManager = new PlayerCargoManager(scene, this)
        //Create kill conditions
        this.vitalsManager.get(DefaultVitals.FUEL).on(PlayerVital.EMPTY, this.respawn.bind(this))
    }

    public respawn() {
        this.movementManager.excavationManager.cancelDrilling()
        this.cargoManager.empty()
        this.vitalsManager.resetAll()
        this.movementManager.moveToSurface()
    }

    public blockPosition() : Phaser.Geom.Point {
        let currentLayer : number = this.y / Config.blockHeight
        let x : number = this.x / Config.blockWidth
        return new Phaser.Geom.Point(Math.floor(x), Math.floor(currentLayer))
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
            if(this.playerSchema.playerState.x != Math.round(this.x * 100) / 100) this.playerSchema.playerState.x = Math.round(this.x * 100) / 100
            if(this.playerSchema.playerState.y != Math.round(this.y * 100) / 100) this.playerSchema.playerState.y = Math.round(this.y * 100) / 100
            if(this.body instanceof Phaser.Physics.Arcade.Body) {
                if(this.playerSchema.playerState.velocityX != this.body.velocity.x) this.playerSchema.playerState.velocityX = this.body.velocity.x
                if(this.playerSchema.playerState.velocityY != this.body.velocity.x) this.playerSchema.playerState.velocityY = this.body.velocity.y
            }
        }
    }

    private gotchiTraits : AavegotchiTraits
    public skillManager : PlayerSkillManager
    public vitalsManager : PlayerVitalsManager
    private cargoManager : PlayerCargoManager
    public  movementManager : PlayerMovementManager
    private lastBlockPosition : Phaser.Geom.Point
    public readonly playerSchema : Schema.Player
    static readonly BLOCK_POSITION_CHANGED: unique symbol = Symbol();

}