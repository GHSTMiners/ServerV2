import { World } from "../../../Rooms/shared/schemas/World/World"
import BlockManager from "../../Managers/BlockManager"
import ClientManager from "../../Managers/ClientManager"
import PlayerManager from "../../Managers/PlayerManager"

export default class MainScene extends Phaser.Scene {

    constructor(world : World) {
        super({key: 'MainScene'})
        this.worldSchema = world
    }

    preload() {

    }

    create() {
        console.log("Created mainscene")
        this.blockManager = new BlockManager(this, this.worldSchema)
        this.clientManager = new ClientManager(this)
        this.playerManager = new PlayerManager(this, this.clientManager, this.worldSchema)
    }

    update(time: number, delta: number): void {

    }

    public worldSchema : World
    public blockManager : BlockManager
    public playerManager : PlayerManager
    public clientManager : ClientManager
}