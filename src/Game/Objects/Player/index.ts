import Config from "../../../Config";
import * as Schema from "../../../Rooms/shared/schemas";
import { AavegotchiTraits } from "../../Helpers/AavegotchiInfoFetcher";
import PlayerBuildingManager from "../../Managers/PlayerBuildingManager";
import PlayerCargoManager from "../../Managers/PlayerCargoManager";
import PlayerMovementManager from "../../Managers/PlayerMovementManager";
import PlayerPurchaseManager from "../../Managers/PlayerPurchaseManager";
import PlayerSkillManager from "../../Managers/PlayerSkillManager";
import PlayerVitalsManager, { DefaultVitals, PlayerVital } from "../../Managers/PlayerVitalsManager";
import PlayerWalletManager from "../../Managers/PlayerWalletManager";
import ClientWrapper from "../ClientWrapper";

export default class Player extends Phaser.GameObjects.Rectangle {
    
    constructor(scene : Phaser.Scene, playerSchema : Schema.Player, traits : AavegotchiTraits, client: ClientWrapper) {
        super(scene, playerSchema.playerState.x, playerSchema.playerState.y)
        this.m_client = client
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
            this.body.setSize(Config.blockWidth * 0.70, Config.blockHeight * 0.85)
            this.body.setOffset(Config.blockWidth * 0.15, Config.blockHeight * 0.15)
        }
        //Configure size and position
        this.setPosition(playerSchema.playerState.x, playerSchema.playerState.y)
        this.setSize(Config.blockWidth*0.5, Config.blockHeight)
        //Create managers
        this.m_walletManager = new PlayerWalletManager(scene, this)
        this.m_buildingManager = new PlayerBuildingManager(scene, this)
        this.m_vitalsManager = new PlayerVitalsManager(scene, traits, playerSchema)
        this.m_skillManager = new PlayerSkillManager(scene, traits, playerSchema)
        this.m_purchaseManager = new PlayerPurchaseManager(scene, this)
        this.m_movementManager = new PlayerMovementManager(scene, this)
        this.m_cargoManager = new PlayerCargoManager(scene, this)
        //Create kill conditions
        this.m_vitalsManager.get(DefaultVitals.FUEL).on(PlayerVital.EMPTY, this.respawn.bind(this))
        this.m_vitalsManager.get(DefaultVitals.HEALTH).on(PlayerVital.EMPTY, this.respawn.bind(this))
    }

    public respawn() {
        this.m_movementManager.excavationManager.cancelDrilling()
        this.m_cargoManager.empty()
        this.m_vitalsManager.resetAll()
        this.m_movementManager.moveToSurface()
    }

    public walletManager() : PlayerWalletManager {
        return this.m_walletManager
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

    public buildingManager() : PlayerBuildingManager {
        return this.m_buildingManager
    }
    
    public client() : ClientWrapper {
        return this.m_client
    }

    private m_client : ClientWrapper
    private m_walletManager : PlayerWalletManager
    private m_skillManager : PlayerSkillManager
    private m_vitalsManager : PlayerVitalsManager
    private m_cargoManager : PlayerCargoManager
    private m_buildingManager : PlayerBuildingManager
    private m_movementManager : PlayerMovementManager
    private m_purchaseManager : PlayerPurchaseManager
    public playerSchema : Schema.Player

}