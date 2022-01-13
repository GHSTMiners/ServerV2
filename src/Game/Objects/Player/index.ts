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
        this.m_vitalsManager = new PlayerVitalsManager(scene, traits, playerSchema)
        this.m_skillManager = new PlayerSkillManager(scene, traits, playerSchema)
        this.m_movementManager = new PlayerMovementManager(scene, this, client)
        this.m_cargoManager = new PlayerCargoManager(scene, this)
        //Create kill conditions
        this.m_vitalsManager.get(DefaultVitals.FUEL).on(PlayerVital.EMPTY, this.respawn.bind(this))
    }

    public respawn() {
        this.m_movementManager.excavationManager.cancelDrilling()
        this.m_cargoManager.empty()
        this.m_vitalsManager.resetAll()
        this.m_movementManager.moveToSurface()
    }

    public skillManager() : PlayerSkillManager {
        return this.m_skillManager
    }

    public vitalsManager() : PlayerVitalsManager {
        return this.m_vitalsManager
    }

    public cargoManager() : PlayerCargoManager {
        return this.m_cargoManager
    }

    public movementManager() : PlayerMovementManager {
        return this.m_movementManager
    }


    public m_skillManager : PlayerSkillManager
    public m_vitalsManager : PlayerVitalsManager
    private m_cargoManager : PlayerCargoManager
    public  m_movementManager : PlayerMovementManager
    public readonly playerSchema : Schema.Player

}