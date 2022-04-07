import { World } from "../../../../Rooms/shared/schemas/World/World";
import * as Schema from "../../../../Rooms/shared/schemas";
import Config from "../../../../Config";
import MainScene from "../../../Scenes/MainScene";
import { BlockSchemaWrapper, BlockInterface } from "../../../Helpers/BlockSchemaWrapper";

export default class BlockManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, world : World) {
        super(scene, "BlockManager") 
        this.world = world
    }

    public blockAt(x : number, y : number) : BlockInterface | undefined {
        if(y < 0 || y > this.world.height) return null
        else if(x < 0 || x > this.world.width) return null
        return BlockSchemaWrapper.stringToBlock(this.world.layers[y].blocks[x])
    }

    public updateBlockAt(x : number, y : number, block : BlockInterface) {
        if(y < 0 || y > this.world.height) return null
        else if(x < 0 || x > this.world.width) return null
        return this.world.layers[y].blocks[x] = BlockSchemaWrapper.blockToString(block)
    }

    private world : World
}