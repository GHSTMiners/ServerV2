import { Schema, type } from "@colyseus/schema"

export class CargoEntry extends Schema {
    @type ("number") cryptoID: number = 0;
    @type ("number") amount : number = 1;
}