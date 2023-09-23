import { Schema, type } from "@colyseus/schema"

export class WalletEntry extends Schema {
    @type ("number") cryptoID: number = 0;
    @type ("number") amount : number = 0;
}