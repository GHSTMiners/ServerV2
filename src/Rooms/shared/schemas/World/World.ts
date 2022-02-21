import { Schema, ArraySchema, type, filterChildren} from "@colyseus/schema"
import { Client } from "colyseus";
import Config from "../../../../Config";
import { Player } from "../Player";
import { Explosive } from "./Explosive";
import { Layer } from "./Layer";

export class World extends Schema {
    @type ("number") id: number = 0;
    @type ("number") width: number = 40;
    @type ("number") height: number = 1000;
    @type ("number") gravity: number = 900;
    @type ("boolean") ready: boolean = false;
    @type ([Explosive]) explosives = new ArraySchema<Explosive>();
    @type ([Player]) players = new ArraySchema<Player>();
    @type ([Layer]) layers = new ArraySchema<Layer>();
}

