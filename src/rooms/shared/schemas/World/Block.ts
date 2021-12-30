import { Schema, type } from "@colyseus/schema"
import { SpawnType } from "chisel-api-interface";
import { Crypto } from "../Crypto";
import { Rock } from "./Rock";

export class Block extends Schema {
    @type("int16") soilID : number = 0;
    @type("uint8") spawnType : SpawnType = SpawnType.None;
    @type("int16") spawnID : number = 0;
}