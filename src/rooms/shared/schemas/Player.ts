import { Schema, ArraySchema, type } from "@colyseus/schema"
import { Block } from "./World/Block";

export class Player extends Schema {
    @type ("string") name: string = "undefined";
    @type ("number") x: number = 0;
    @type ("number") y: number = 0;
    @type ("number") gotchiID: number = 0;

}