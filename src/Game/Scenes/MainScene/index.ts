import { World } from "../../../Rooms/shared/schemas/World/World"
import BlockManager from "../../Managers/BlockManager"
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
        this.playerManager = new PlayerManager(this, this.worldSchema)
    }

    update(time: number, delta: number): void {

    }

    private worldSchema : World
    private blockManager : BlockManager
    private playerManager : PlayerManager
}