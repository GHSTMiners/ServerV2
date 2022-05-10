import { Schema, type } from "@colyseus/schema"

export class Crypto extends Schema {
    @type("string") name: string;
    @type("string") address: string;
    @type("number") weight: number;
    @type("string") shortcode: string;
}