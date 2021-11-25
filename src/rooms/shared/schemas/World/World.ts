import { Schema, ArraySchema, type } from "@colyseus/schema"
import { Player } from "../Player";
import { Block } from "./Block";

export class World extends Schema {
    @type ("number") width: number = 40;
    @type ("number") height: number = 1000;
    @type ("number") gravity: number = 900;
    @type([Block]) blocks = new ArraySchema<Block>();
    @type([Player]) players = new ArraySchema<Player>();
}