import { Schema, ArraySchema, type, filterChildren, MapSchema} from "@colyseus/schema"
import { Client } from "colyseus";
import Config from "../../../../Config";

export class Lobby extends Schema {
    @type ("number") id: number = 0;
    @type ("number") clients: number = 40;
}

export class Player extends Schema {

}
