import { Schema, ArraySchema, type } from "@colyseus/schema"
import { Block } from "./World/Block";

export class Player extends Schema {
    @type ("string") name: string = "undefined";
    @type ("number") x: number = Math.random() * 10 * 300;
    @type ("number") y: number = -300;
    @type ("number") gotchiID: number = 0;

}