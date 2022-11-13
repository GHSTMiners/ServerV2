import { HealthState } from "../../../../Schemas"
import Player from "../../../Objects/Player"
import { DefaultVitals, PlayerVital } from "../PlayerVitalsManager"
import * as Protocol from "gotchiminer-multiplayer-protocol"
import Config from "../../../../Config"
import MainScene from "../../../Scenes/MainScene"

export default class PlayerRespawnManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, player : Player) {
        super(scene, "PlayerRespawnManager")
        this.player = player
        this.mainScene = scene
        //Create kill conditions
        player.vitalsManager().get(DefaultVitals.FUEL).on(PlayerVital.EMPTY, this.respawn.bind(this))
        player.vitalsManager().get(DefaultVitals.HEALTH).on(PlayerVital.EMPTY, this.respawn.bind(this))
    }

    public respawn(options? : any) {
        //Notify client of player death
        this.player.playerSchema.playerState.healthState = HealthState.Deceased;
        let diedMessage : Protocol.NotifyPlayerDied = new Protocol.NotifyPlayerDied(options)
        diedMessage.gotchiId = this.player.playerSchema.gotchiID
        diedMessage.lostCargo = this.player.vitalsManager().get(DefaultVitals.CARGO).isDepleted()
        let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(diedMessage)
        this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
        // Stop all movement and clear cargo
        this.player.movementManager().suspend(Config.deathTimeout);
        this.player.movementManager().m_excavationManager.cancelDrilling()
        this.player.cargoManager().empty()
        this.emit(PlayerRespawnManager.DIED)

        setTimeout(() => {
            // Notify client of respawn
            let respawnedMessage : Protocol.NotifyPlayerRespawned = new Protocol.NotifyPlayerRespawned({gotchiId: this.player.playerSchema.gotchiID})
            let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(respawnedMessage)
            this.mainScene.room.broadcast(serializedMessage.name, serializedMessage.data)
            // Reset vitals and respawn
            this.player.playerSchema.playerState.healthState = HealthState.Healthy;
            this.player.vitalsManager().resetAll()
            this.player.movementManager().moveToNearestPortal()
            this.emit(PlayerRespawnManager.RESPAWNED)
        }, Config.deathTimeout);
    }
    static readonly DIED: unique symbol = Symbol();

    static readonly RESPAWNED: unique symbol = Symbol();
    private mainScene : MainScene
    private player : Player
}