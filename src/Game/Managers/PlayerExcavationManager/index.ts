import { SpawnType } from "chisel-api-interface";
import { Block, PlayerState } from "../../../Rooms/shared/schemas/Schemas";
import Player from "../../Objects/Player";
import BlockManager from "../BlockManager";

export default class PlayerExcavationManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player, blockManager : BlockManager) {
        super(scene, "PlayerExcavationManager")
        this.nextDrillTime = Date.now()
        this.player = player
        this.blockManager = blockManager
        scene.add.existing(this)
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        if(this.nextDrillTime <= Date.now() && this.player.playerSchema.playerState == PlayerState.Drilling) {
            //Update next drillTime
            this.nextDrillTime = Date.now() + 400
            let targetBlockCoordinates : Phaser.Geom.Point = this.player.blockPosition()
            targetBlockCoordinates.y += 1
            this.blockManager.blockAt(targetBlockCoordinates.x, targetBlockCoordinates.y).spawnType = SpawnType.None
        }
    }

    private blockManager : BlockManager
    private nextDrillTime : number
    private player : Player
}