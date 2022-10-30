import { DetailedWorld } from "chisel-api-interface"
import { Room } from "colyseus"
import { World } from "../../../Schemas/World/World"
import BlockManager from "../../Managers/World/BlockManager"
import ChatManager from "../../Managers/World/ChatManager"
import ClientManager from "../../Managers/World/ClientManager"
import ExchangeManager from "../../Managers/World/ExchangeManager"
import ExplosivesManager from "../../Managers/World/ExplosivesManager"
import PlayerCollisionManager from "../../Managers/Player/PlayerCollisionManager"
import PlayerManager from "../../Managers/World/PlayerManager"
import PlayTimeManager from "../../Managers/World/PlayTimeManager"
import LoggingManager from "../../Managers/World/LoggingManager"

export default class MainScene extends Phaser.Scene {

    constructor(room : Room<World>, worldInfo : DetailedWorld) {
        super({key: 'MainScene'})
        this.room = room
        this.worldSchema = room.state
        this.worldInfo = worldInfo
    }

    create() {
        this.clientManager = new ClientManager(this)
        this.playerManager = new PlayerManager(this, this.clientManager, this.room)
        this.chatManager = new ChatManager(this, this.playerManager)
        this.blockManager = new BlockManager(this, this.room.state)
        this.exchangeManager = new ExchangeManager(this, this.playerManager);
        this.playerCollisionManager = new PlayerCollisionManager(this, this.playerManager, this.blockManager, this.worldSchema)
        this.explosiveManager = new ExplosivesManager(this, this.blockManager, this.playerManager)
        this.playTimeManager = new PlayTimeManager(this, this.playerManager)
        this.loggingManager = new LoggingManager(this)

    }

    update(time: number, delta: number): void {
    }   

    public room : Room<World>
    public worldSchema : World
    public chatManager : ChatManager
    public blockManager : BlockManager
    public playerManager : PlayerManager
    public loggingManager : LoggingManager
    public clientManager : ClientManager
    public playTimeManager : PlayTimeManager
    public exchangeManager : ExchangeManager
    public explosiveManager : ExplosivesManager
    public playerCollisionManager : PlayerCollisionManager
    public readonly worldInfo : DetailedWorld
}