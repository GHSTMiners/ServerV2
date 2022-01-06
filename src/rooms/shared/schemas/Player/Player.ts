import { Schema, MapSchema, type } from "@colyseus/schema"
import { Block } from "../World/Block";
import { PlayerState, DrillingDirection } from "./PlayerStates";
import { WalletEntry } from "./WalletEntry";
import { CargoEntry } from "./CargoEntry";

export class Player extends Schema {
    @type ("string") name: string = "aavegotchi";
    @type ("string") playerSessionID: string = "";
    @type ("int32") x: number = Math.random() * 10 * 300;
    @type ("int32") y: number = -300;
    @type ("number") gotchiID: number = 0;
    @type ("number") playerState : PlayerState = PlayerState.Stationary
    @type ("number") drillingDirection : DrillingDirection = DrillingDirection.Down
    @type ({ map: WalletEntry }) wallet = new MapSchema<WalletEntry>();
    @type ({ map: CargoEntry }) cargo = new MapSchema<CargoEntry>();

}