import { Schema, ArraySchema, type } from "@colyseus/schema"
import { Block } from "./World/Block";

export class Player extends Schema {
    @type ("string") name: string = "aavegotchi";
    @type ("string") playerSessionID: string = "";
    @type ("int32") x: number = Math.random() * 10 * 300;
    @type ("int32") y: number = -300;
    @type ("number") gotchiID: number = 0;

}