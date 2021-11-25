import { Schema, type } from "@colyseus/schema"

export class Explosive extends Schema {
    @type("string") name: string;
    @type("string") address: string;
    @type("number") weight: number;
}