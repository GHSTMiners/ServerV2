import { DetailedWorld } from "chisel-api-interface"
import { Room } from "colyseus"
import { World } from "../../../Rooms/shared/schemas/World/World"
import BlockManager from "../../Managers/BlockManager"
import ClientManager from "../../Managers/ClientManager"
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
        this.blockManager = new BlockManager(this, this.room.state, this.playerManager)
    }

    update(time: number, delta: number): void {
    }   

    public room : Room<World>
    public worldSchema : World
    public blockManager : BlockManager
    public playerManager : PlayerManager
    public clientManager : ClientManager
    public readonly worldInfo : DetailedWorld
}