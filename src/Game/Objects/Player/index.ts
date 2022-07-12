import Config from "../../../Config";
import * as Schema from "../../../Schemas";
import { AavegotchiTraits } from "../../../Helpers/AavegotchiInfoFetcher";
import PlayerBuildingManager from "../../Managers/Player/PlayerBuildingManager";
import PlayerCargoManager from "../../Managers/Player/PlayerCargoManager";
import PlayerMovementManager from "../../Managers/Player/PlayerMovementManager";
import PlayerPurchaseManager from "../../Managers/Player/PlayerPurchaseManager";
import PlayerSkillManager from "../../Managers/Player/PlayerSkillManager";
import PlayerVitalsManager, { DefaultVitals, PlayerVital } from "../../Managers/Player/PlayerVitalsManager";
import PlayerWalletManager from "../../Managers/Player/PlayerWalletManager";
import ClientWrapper from "../../../Helpers/ClientWrapper";
import PlayerStatisticsManager, { DefaultStatistics } from "../../Managers/Player/PlayerStatisticsManager";
import PlayerExcavationManager from "../../Managers/Player/PlayerExcavationManager";
import * as Chisel from "chisel-api-interface"
import { PlayerUpgradeManager } from "../../Managers/Player/PlayerUpgradeManager";
import MainScene from "../../Scenes/MainScene";
import PlayerDiagnosticsManager from "../../Managers/Player/PlayerDiagnosticsManager";

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
        this.m_diagnosticsManager = new PlayerDiagnosticsManager(scene, this);
        this.m_statisticsManager = new PlayerStatisticsManager(scene, this);
        this.m_walletManager = new PlayerWalletManager(scene, this)
        this.m_buildingManager = new PlayerBuildingManager(scene, this)
        this.m_upgradeManager = new PlayerUpgradeManager(scene, this)
        this.m_vitalsManager = new PlayerVitalsManager(scene, traits, this)
        this.m_skillManager = new PlayerSkillManager(scene, traits, this)
        this.m_purchaseManager = new PlayerPurchaseManager(scene, this)
        this.m_movementManager = new PlayerMovementManager(scene, this)
        this.m_cargoManager = new PlayerCargoManager(scene, this)
        //Create kill conditions
        this.m_vitalsManager.get(DefaultVitals.FUEL).on(PlayerVital.EMPTY, this.respawn.bind(this))
        this.m_vitalsManager.get(DefaultVitals.HEALTH).on(PlayerVital.EMPTY, this.respawn.bind(this))
        //Bind statistics
        this.purchaseManager().on(PlayerPurchaseManager.PURCHASED_EXPLOSIVE, (explosive : Chisel.Explosive) => {
            this.statisticsManager().addAmount(DefaultStatistics.AMOUNT_SPENT_EXPLOSIVES, explosive.price)
        })
        this.movementManager().excavationManager().on(PlayerExcavationManager.BLOCK_MINED, () => this.statisticsManager().addAmount(DefaultStatistics.BLOCKS_MINED))
        this.vitalsManager().get(DefaultVitals.HEALTH).on(PlayerVital.DECREASED, (amount : number) => {
            this.statisticsManager().addAmount(DefaultStatistics.DAMAGE_TAKEN, amount)
        })
        this.vitalsManager().get(DefaultVitals.FUEL).on(PlayerVital.DECREASED, (amount : number) => {
            this.statisticsManager().addAmount(DefaultStatistics.FUEL_CONSUMED, amount)
        })
        this.walletManager().on(PlayerWalletManager.ADDED_CRYPTO, (cryptoId : number, amount : number) => {
            // Conver to dollar value
            let dollarValue : number = (scene as MainScene).exchangeManager.dollarValue(cryptoId, amount)
            this.statisticsManager().addAmount(DefaultStatistics.TOTAL_CRYPTO_MINED, dollarValue)
            this.statisticsManager().addAmount(DefaultStatistics.ENDGAME_CRYPTO, dollarValue)
        })
        this.walletManager().on(PlayerWalletManager.TAKEN_CRYPTO, (cryptoId : number, amount : number) => {
            // Conver to dollar value
            let dollarValue : number = (scene as MainScene).exchangeManager.dollarValue(cryptoId, amount)
            this.statisticsManager().takeAmount(DefaultStatistics.ENDGAME_CRYPTO, dollarValue)
        })
        this.on(Player.RESPAWNED, () => this.statisticsManager().addAmount(DefaultStatistics.DEATHS))
    }

    public respawn() {
        this.m_movementManager.m_excavationManager.cancelDrilling()
        this.m_cargoManager.empty()
        this.m_vitalsManager.resetAll()
        this.m_movementManager.moveToNearestPortal()
        this.emit(Player.RESPAWNED)
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

    public upgradeManager() : PlayerUpgradeManager {
        return this.m_upgradeManager
    }

    public movementManager() : PlayerMovementManager {
        return this.m_movementManager
    }

    public buildingManager() : PlayerBuildingManager {
        return this.m_buildingManager
    }

    public purchaseManager() : PlayerPurchaseManager {
        return this.m_purchaseManager
    }

    public statisticsManager() : PlayerStatisticsManager {
        return this.m_statisticsManager
    }

    public diagnosticManager() : PlayerDiagnosticsManager {
        return this.m_diagnosticsManager
    }
    
    public client() : ClientWrapper {
        return this.m_client
    }

    private m_client : ClientWrapper
    private m_walletManager : PlayerWalletManager
    private m_skillManager : PlayerSkillManager
    private m_vitalsManager : PlayerVitalsManager
    private m_cargoManager : PlayerCargoManager
    private m_upgradeManager : PlayerUpgradeManager
    private m_buildingManager : PlayerBuildingManager
    private m_movementManager : PlayerMovementManager
    private m_purchaseManager : PlayerPurchaseManager
    private m_statisticsManager : PlayerStatisticsManager
    private m_diagnosticsManager : PlayerDiagnosticsManager
    

    public playerSchema : Schema.Player
    static readonly RESPAWNED: unique symbol = Symbol();

}