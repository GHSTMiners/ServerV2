import { Schema, type } from "@colyseus/schema"

export class StatisticEntry extends Schema {
    @type ("number") id: number = 0;
    @type ("number") value : number = 0;
}