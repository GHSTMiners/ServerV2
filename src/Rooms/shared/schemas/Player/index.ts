import { Schema, MapSchema, ArraySchema, type, filter } from "@colyseus/schema"
import { PlayerState } from "./PlayerState";
import { WalletEntry } from "./WalletEntry";
import { CargoEntry } from "./CargoEntry";
import { Vital } from "./Vital";
import { Skill } from "./Skill";
import { Client } from "colyseus";
import { ExplosiveEntry } from "./ExplosiveEntry";

export class Player extends Schema {
    @type ("string") name: string = "aavegotchi";
    @type ("string") playerSessionID: string = "";
    @type ("number") gotchiID: number = 0;
    @type ("string") chatColor: string = "#ffffff";
    @filter(function(this: Player, client: Client, value: Player['peerID']) { return this.playerSessionID == client.sessionId})
    @type ("string") peerID : string = ""
    @type (PlayerState) playerState : PlayerState = new PlayerState();
    @filter(function(this: Player, client: Client, value: Player['vitals']) { return this.playerSessionID == client.sessionId})
    @type ( [Vital] ) vitals = new ArraySchema<Vital>();
    @filter(function(this: Player, client: Client, value: Player['skills']) { return this.playerSessionID == client.sessionId})
    @type ( [Skill] ) skills = new ArraySchema<Skill>();
    @filter(function(this: Player, client: Client, value: Player['cargo']) { return this.playerSessionID == client.sessionId})
    @type ({ map: CargoEntry }) cargo = new MapSchema<CargoEntry>();
    @filter(function(this: Player, client: Client, value: Player['wallet']) { return this.playerSessionID == client.sessionId})
    @type ({ map: WalletEntry }) wallet = new MapSchema<WalletEntry>();
    @filter(function(this: Player, client: Client, value: Player['explosives']) { return this.playerSessionID == client.sessionId})
    @type ({ map: ExplosiveEntry}) explosives = new MapSchema<ExplosiveEntry>();
}