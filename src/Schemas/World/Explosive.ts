import { Schema, type } from "@colyseus/schema"
import { SpawnType } from "chisel-api-interface";
import { Crypto } from "../Crypto";

export class Explosive extends Schema {
    @type ("uint16") explosiveID : number = 0;
    @type ("int32") x: number = 0;
    @type ("int32") y: number = 0;
}