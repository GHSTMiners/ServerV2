import { Schema, type } from "@colyseus/schema"

export class Vital extends Schema {
    @type ("string") name : string = ""
    @type ("number") maximum : number = 0;
    @type ("number") minimum : number = 0;
    @type ("number") emptyValue : number = 0;
    @type ("number") filledValue : number = 0;
    @type ("number") currentValue: number = 0;
}