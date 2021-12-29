import * as Schema from "../../../Rooms/shared/schemas/Schemas"
import { Scene } from "phaser";
import Player from "../../Objects/Player";

export default class PlayerManager extends Phaser.GameObjects.GameObject{
    constructor(scene: Scene, worldSchema : Schema.World) {
        super(scene, "PlayerManager")
        this.worldSchema = worldSchema;
        this.worldSchema.players.onAdd = this.playerAdded;
        this.worldSchema.players.onRemove = this.playerRemoved;
    }

    private playerAdded(item: Schema.Player, key: number): void {
        this.playerMap.set(item, new Player(this.scene, 128,128, item));
    }

    private playerRemoved(item: Schema.Player, key: number): void {
        let player : Player | undefined = this.playerMap.get(item)
        if(player) {
            player.destroy()
            this.playerMap.delete(item)
        }
    }

    private playerMap : Map<Schema.Player, Player>
    private worldSchema : Schema.World
}