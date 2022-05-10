import { Schema, ArraySchema, type, filterChildren, MapSchema} from "@colyseus/schema"
import { PlayerState } from "./PlayerState";

export class Lobby extends Schema {
    @type ("string") game_id : string = '';
    @type ("number") countdown : number = 300
    @type ("number") state : LobbyState = LobbyState.Open
    @type ([PlayerState]) players = new ArraySchema<PlayerState>();
}

export enum LobbyState {
    Open = 1,
    Full = 2,
    Starting = 3,
    Started = 4,
}