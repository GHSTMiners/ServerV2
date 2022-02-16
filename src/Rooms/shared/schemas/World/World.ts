import { Schema, ArraySchema, type, filterChildren} from "@colyseus/schema"
import { Client } from "colyseus";
import Config from "../../../../Config";
import { Player } from "../Player";
import { Layer } from "./Layer";

export class World extends Schema {
    @type ("number") id: number = 0;
    @type ("number") width: number = 40;
    @type ("number") height: number = 1000;
    @type ("number") gravity: number = 900;
    @type ("boolean") ready: boolean = false;
    @type ([Player]) players = new ArraySchema<Player>();

    // @filterChildren(function(client: Client, layerIndex: number, layer: Layer, root: World) {
    //     let player : Player  | undefined = client.userData
    //     if (player) {
    //         let playerlayer : number = player.playerState.y / Config.blockHeight
    //         return (Phaser.Math.Within(playerlayer, layerIndex, Config.layerRevealRadius)) 
    //     } else return false
    // })
    @type ([Layer]) layers = new ArraySchema<Layer>();
}

