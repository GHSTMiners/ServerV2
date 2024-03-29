import Config from "../../../Config"
import * as Schema from "../../../Schemas"
import { BlockInterface, BlockSchemaWrapper } from "../../../Helpers/BlockSchemaWrapper"
export default class Block extends Phaser.GameObjects.Rectangle {
    constructor(scene: Phaser.Scene, blockSchema: BlockSchemaWrapper, x: number, y: number, width?: number, height?: number) {
        super(scene, x, y, width, height) 
        this.blockSchema = blockSchema
        //Create a body for the rectangle
        this.scene.physics.add.existing(this, true)
        //Resize block to correct size
        this.setPosition(x, y)
        this.setSize(Config.blockWidth, Config.blockWidth)
    }

    public readonly blockSchema : BlockSchemaWrapper
}