import { World } from "../../../Rooms/shared/schemas/World/World";
import { ArraySchema, type } from "@colyseus/schema"
import { Block } from "../../../Rooms/shared/schemas/World/Block";
import Config from "../../../Config";

export default class BlockManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, world : World) {
        super(scene, "BlockManager") 
        this.world = world
        this.staticBodies = []
        // Set world bounds
        this.scene.physics.world.setBounds(0, -Config.skyHeight, 
            world.width * Config.blockWidth, Config.skyHeight + world.height * Config.blockHeight, true, true, true, true)
    }

    private initialize() {
        let blocks : ArraySchema<Block> = this.world.blocks;
        for (let index = 0; index < blocks.length; index++) {
            const element = blocks[index];
            let rectangle  : Phaser.GameObjects.GameObject = new Phaser.GameObjects.GameObject(this.scene, "");

        }
    }

    private staticBodies : Array<Phaser.Physics.Arcade.StaticBody>
    private world : World
}