import { Schema, type } from "@colyseus/schema"

export class Skill extends Schema {
    @type ("string") name : string = ""
    @type ("number") maximum : number = 0;
    @type ("number") minimum : number = 0;
    @type ("number") currentValue: number = 0;
}