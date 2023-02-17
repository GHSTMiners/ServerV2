import { Schema, MapSchema, ArraySchema, type, filter } from "@colyseus/schema"
import { PlayerState } from "./PlayerState";
import { WalletEntry } from "./WalletEntry";
import { ConsumableEntry } from "./ConsumableEntry";
import { CargoEntry } from "./CargoEntry";
import { Vital } from "./Vital";
import { Skill } from "./Skill";
import { Client } from "colyseus";
import { StatisticEntry } from "./StatisticEntry"
import { ExplosiveEntry } from "./ExplosiveEntry";
import { Upgrade } from "./Upgrade";

export class Player extends Schema {
    @type ("string") name: string = "aavegotchi";
    @type ("string") playerSessionID: string = "";
    @type ("number") gotchiID: number = 0;
    @type ("string") walletAddress: string = "";
    @type ("string") chatColor: string = "#ffffff";
    @filter(function(this: Player, client: Client, value: Player['peerID']) { return this.playerSessionID == client.sessionId})
    @type ("string") peerID : string = ""
    @type (PlayerState) playerState : PlayerState = new PlayerState();
    @type ({ map: Upgrade}) upgrades = new MapSchema<Upgrade>();
    @filter(function(this: Player, client: Client, value: Player['vitals']) { return this.playerSessionID == client.sessionId})
    @type ( [Vital] ) vitals = new ArraySchema<Vital>();
    @filter(function(this: Player, client: Client, value: Player['skills']) { return this.playerSessionID == client.sessionId})
    @type ( [Skill] ) skills = new ArraySchema<Skill>();
    @type ({ map: CargoEntry }) cargo = new MapSchema<CargoEntry>();
    @type ({ map: WalletEntry }) wallet = new MapSchema<WalletEntry>();
    @type ({ map: ConsumableEntry }) consumable = new MapSchema<ConsumableEntry>();
    @filter(function(this: Player, client: Client, value: Player['explosives']) { return this.playerSessionID == client.sessionId})
    @type ({ map: ExplosiveEntry}) explosives = new MapSchema<ExplosiveEntry>();
    @type ({ map: StatisticEntry}) statistics = new MapSchema<StatisticEntry>();
}