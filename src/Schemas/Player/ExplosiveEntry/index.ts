import { Schema, type } from "@colyseus/schema"

export class ExplosiveEntry extends Schema {
    @type ("number") explosiveID: number = 0;
    @type ("number") amount : number = 0;
    @type ("number") nextTimeAvailable : number = 0;
    @type ("number") amountSpawned : number = 0;
    @type ("number") amountPurchased : number = 0;
    
}