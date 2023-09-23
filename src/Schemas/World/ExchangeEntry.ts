import { Schema, type } from "@colyseus/schema"

export class ExchangeEntry extends Schema {
    @type ("int32") crypto_id : number = 0;
    @type ("float32") usd_value: number = 1;
}