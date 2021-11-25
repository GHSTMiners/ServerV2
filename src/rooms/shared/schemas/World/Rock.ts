import { Schema, type } from "@colyseus/schema"

export class Rock extends Schema {
    @type("boolean") digable: boolean;
    @type("boolean") explodable: boolean;
    @type("boolean") lava: boolean;
}