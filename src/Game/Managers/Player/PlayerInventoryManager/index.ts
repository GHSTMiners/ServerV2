import * as Schema from "../../../../Rooms/shared/schemas"
import Player from "../../../Objects/Player"

export default class PlayerInventroyManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerInventoryManager")
        this.playerSchema = player.playerSchema
    }

    private playerSchema : Schema.Player
}