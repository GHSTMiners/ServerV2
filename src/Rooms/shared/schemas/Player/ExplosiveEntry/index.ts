import { Schema, type } from "@colyseus/schema"

export class ExplosiveEntry extends Schema {
    @type ("number") explosiveID: number = 0;
    @type ("number") amount : number = 1;
}