import { Schema, type } from "@colyseus/schema"
import { SpawnType } from "chisel-api-interface";
import { Crypto } from "../Crypto";
import { Rock } from "./Rock";

export class Block extends Schema {
    @type("number") soilID : number = 0;
    @type("number") spawnType : SpawnType = SpawnType.None;
    @type("number") spawnID : number = 0;
}