import { Schema, type } from "@colyseus/schema"
import { Crypto } from "../Crypto";
import { Rock } from "./Rock";

export class Block extends Schema {
    @type(Crypto) crypto: Crypto = new Crypto();
    @type(Rock) rock: Rock = new Rock();
}