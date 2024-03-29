import { Schema, MapSchema, type } from "@colyseus/schema"

export class PlayerState extends Schema {
    @type ("int32") x: number = Math.random() * 10 * 300;
    @type ("int32") y: number = -300;
    @type ("int32") velocityX: number = 0;
    @type ("int32") velocityY: number = 0;
    @type ("number") healthState : HealthState = HealthState.Healthy
    @type ("number") movementState : MovementState = MovementState.Stationary
    @type ("number") movementDirection : MovementDirection = MovementDirection.Down
}

export enum MovementState {
    Stationary = 0,
    Moving = 1,
    Flying = 2,
    Drilling = 3
}

export enum HealthState {
    Healthy = 0,
    Hurt = 1,
    Deceased = 2,
}

export enum MovementDirection {
    Down = 1,
    Left = 2,
    Right = 3,
    None = 4
}