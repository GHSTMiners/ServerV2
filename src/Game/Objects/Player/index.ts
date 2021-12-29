import * as Schema from "../../../Rooms/shared/schemas/Player";

export default class Player extends Phaser.GameObjects.Sprite {
    constructor(scene : Phaser.Scene, x : number, y: number, playerSchema : Schema.Player) {
        super(scene, x, y, "")
        this.playerSchema = playerSchema

        //Configure size
        this.setSize(128*0.85, 128)
    }

    private playerSchema : Schema.Player
}