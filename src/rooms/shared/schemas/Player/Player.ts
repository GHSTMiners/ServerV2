import { Schema, ArraySchema, type } from "@colyseus/schema"
import { Block } from "../World/Block";

export enum PlayerState {
    Stationary = 0,
    Moving = 1,
    Flying = 2,
    Drilling = 3
}

export enum DrillingDirection {
    Down = 1,
    Left = 2,
    Right = 3,
    None = 4
}

export class Player extends Schema {
    @type ("string") name: string = "aavegotchi";
    @type ("string") playerSessionID: string = "";
    @type ("int32") x: number = Math.random() * 10 * 300;
    @type ("int32") y: number = -300;
    @type ("number") gotchiID: number = 0;
    @type ("number") playerState : PlayerState = PlayerState.Stationary
    @type ("number") drillingDirection : DrillingDirection = DrillingDirection.Down
}