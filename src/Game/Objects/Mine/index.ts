import Config from "../../../Config";
import * as Schema from "../../../Schemas";
import MainScene from "../../Scenes/MainScene";
import Player from "../Player";
import * as Chisel from "chisel-api-interface";
import { boolean } from "mathjs";

export default class Mine extends Phaser.GameObjects.Rectangle {
    constructor(scene : Phaser.Scene, explosiveSchema : Schema.Explosive, explosiveInfo : Chisel.Explosive, owner : Player) {
        super(scene, explosiveSchema.x, explosiveSchema.y)
        this.isExploded = false
        this.owner = owner
        this.explosiveInfo = explosiveInfo
        this.explosiveSchema = explosiveSchema
        this.lastBlockPosition = new Phaser.Geom.Point()
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        if(this.playerWithinBlastRadius()) this.explode()
    }

    public playerWithinBlastRadius() : boolean {
        if (this.scene instanceof MainScene) {
            let exploded : boolean = false
            const scene = this.scene as MainScene
            const blockPosition = this.blockPosition()
            this.explosiveInfo.explosion_coordinates.forEach(coordinate => {
                //Calculate coordinates
                let explosionPoint : Phaser.Geom.Point = new Phaser.Geom.Point(blockPosition.x + coordinate.y, blockPosition.y + coordinate.x)
                //Take health from player
                const self = this
                scene.playerManager.playersAt(explosionPoint).forEach(player => {
                    if(player != self.owner) {
                        exploded = true;
                    }
                }, this)
            })
            return exploded;
        } else return false
    }

    private explode() {
        if(!this.isExploded) {
            this.isExploded = true
            this.emit(Mine.EXPLODED, this)
        }
    }

    public blockPosition() : Phaser.Geom.Point {
        let currentLayer : number = this.y / Config.blockHeight
        let x : number = this.x / Config.blockWidth
        return new Phaser.Geom.Point(Math.floor(x), Math.floor(currentLayer))
    }

    public isExploded : boolean
    
    public readonly owner : Player
    public explosiveSchema : Schema.Explosive
    public explosiveInfo : Chisel.Explosive
    static readonly EXPLODED: unique symbol = Symbol();
    private lastBlockPosition : Phaser.Geom.Point
}