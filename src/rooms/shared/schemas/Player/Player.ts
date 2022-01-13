import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema"
import { PlayerState, DrillingDirection } from "./PlayerState";
import { WalletEntry } from "./WalletEntry";
import { CargoEntry } from "./CargoEntry";
import { Vital } from "./Vital";
import { Skill } from "./Skill";

export class Player extends Schema {
    @type ("string") name: string = "aavegotchi";
    @type ("string") playerSessionID: string = "";
    @type ("number") gotchiID: number = 0;
    @type (PlayerState) playerState : PlayerState = new PlayerState();
    @type ( [Vital] ) vitals = new ArraySchema<Vital>();
    @type ( [Skill] ) skills = new ArraySchema<Skill>();
    @type ({ map: CargoEntry }) cargo = new MapSchema<CargoEntry>();
    @type ({ map: WalletEntry }) wallet = new MapSchema<WalletEntry>();
}