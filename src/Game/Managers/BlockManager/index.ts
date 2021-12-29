import { World } from "../../../Rooms/shared/schemas/World/World";
import { ArraySchema, type } from "@colyseus/schema"
import { Block } from "../../../Rooms/shared/schemas/World/Block";

export default class BlockManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, world : World) {
        super(scene, "BlockManager") 
        this.world = world
        this.staticBodies = []
        this.initialize()
    }

    private initialize() {
        let blocks : ArraySchema<Block> = this.world.blocks;
        for (let index = 0; index < blocks.length; index++) {
            const element = blocks[index];
            let rectangle  : Phaser.GameObjects.GameObject = new Phaser.GameObjects.GameObject(this.scene, "");
            // rectangle.body
            // console.log(rectangle.body)
        }
    }

    private staticBodies : Array<Phaser.Physics.Arcade.StaticBody>
    private world : World
}