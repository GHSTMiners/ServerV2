import { DetailedWorld } from "chisel-api-interface"
import { Room } from "colyseus"
import { World } from "../../../Rooms/shared/schemas/World/World"
import BlockManager from "../../Managers/BlockManager"
import ChatManager from "../../Managers/ChatManager"
import ClientManager from "../../Managers/ClientManager"
import ExplosivesManager from "../../Managers/ExplosivesManager"
import PlayerCollisionManager from "../../Managers/PlayerCollisionManager"
import PlayerManager from "../../Managers/PlayerManager"

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
        this.blockManager = new BlockManager(this, this.room.state)
        this.playerCollisionManager = new PlayerCollisionManager(this, this.playerManager, this.blockManager, this.worldSchema)
        this.explosiveManager = new ExplosivesManager(this, this.blockManager, this.playerManager)
    }

    update(time: number, delta: number): void {
    }   

    public room : Room<World>
    public worldSchema : World
    public chatManager : ChatManager
    public blockManager : BlockManager
    public playerManager : PlayerManager
    public clientManager : ClientManager
    public explosiveManager : ExplosivesManager
    public playerCollisionManager : PlayerCollisionManager
    public readonly worldInfo : DetailedWorld
}