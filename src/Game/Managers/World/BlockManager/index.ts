import { World } from "../../../../Rooms/shared/schemas/World/World";
import * as Schema from "../../../../Rooms/shared/schemas";
import Config from "../../../../Config";
import MainScene from "../../../Scenes/MainScene";

export default class BlockManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, world : World) {
        super(scene, "BlockManager") 
        this.world = world
    }

    public blockAt(x : number, y : number) : Schema.Block | undefined {
        if(y < 0 || y > this.world.height) return null
        else if(x < 0 || x > this.world.width) return null
        return this.world.layers[y].blocks[x]
    }

    private world : World
}