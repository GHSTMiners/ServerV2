import { World } from "../../../../Schemas/World/World";
import * as Schema from "../../../../Schemas";
import Config from "../../../../Config";
import MainScene from "../../../Scenes/MainScene";
import { BlockSchemaWrapper, BlockInterface } from "../../../../Helpers/BlockSchemaWrapper";

export default class BlockManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, world : World) {
        super(scene, "BlockManager") 
        this.world = world
    }

    public blockAt(x : number, y : number) : BlockSchemaWrapper | undefined {
        if(y < 0 || y > this.world.height) return null
        else if(x < 0 || x > this.world.width) return null
        return new BlockSchemaWrapper(this.world.layers[y].blocks, x)
    }

    private world : World
}