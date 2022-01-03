import Config from "../../../Config"

export default class Block extends Phaser.GameObjects.Rectangle {
    constructor(scene: Phaser.Scene, x: number, y: number, width?: number, height?: number) {
        super(scene, x, y, width, height) 
        //Create a body for the rectangle
        this.scene.physics.add.existing(this, true)
        //Resize block to correct size
        this.setPosition(x, y)
        this.setSize(Config.blockWidth, Config.blockWidth)
    }
}