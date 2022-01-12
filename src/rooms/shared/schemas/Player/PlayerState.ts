import { Schema, MapSchema, type } from "@colyseus/schema"

export class PlayerState extends Schema {
    @type ("int32") x: number = Math.random() * 10 * 300;
    @type ("int32") y: number = -300;
    @type ("int32") velocityX: number = 0;
    @type ("int32") velocityY: number = 0;
    @type ("number") gotchiID: number = 0;
    @type ("number") movementState : MovementState = MovementState.Stationary
    @type ("number") drillingDirection : DrillingDirection = DrillingDirection.Down
}

export enum MovementState {
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