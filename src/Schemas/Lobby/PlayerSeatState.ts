import { Schema, ArraySchema, type, filterChildren, MapSchema} from "@colyseus/schema"
import { Client } from "colyseus";

export class PlayerSeatState extends Schema {
    @type ("number") map_vote: number = -1;
    @type ("number") gotchi_id: number = 0;
    @type ("boolean") ready: boolean = false;
}
