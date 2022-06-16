import ClientWrapper from "../../Helpers/ClientWrapper";
import PlayerSeat from "../PlayerSeat/PlayerSeat";
import * as Schema from "../../Schemas";

export default class PlayerSeatManager {
    constructor(schema : Schema.Lobby) {
        this.schema = schema
        this.playerSeats = new Map<ClientWrapper, PlayerSeat>()
        this.playerSeatStates = new Map<ClientWrapper, Schema.PlayerSeatState>()
    }

    public handleClientJoined(client : ClientWrapper) {
        let playerSeatState : Schema.PlayerSeatState = new Schema.PlayerSeatState()
        this.schema.player_seats.push(playerSeatState)
        let playerSeat : PlayerSeat = new PlayerSeat(client, playerSeatState);
        this.playerSeats.set(client, playerSeat)
        this.playerSeatStates.set(client, playerSeatState)
    }

    public handleClientLeave(client : ClientWrapper) {
        let playerSeat : PlayerSeat | undefined = this.playerSeats.get(client)
        if(playerSeat) {
            this.playerSeats.delete(client)
            this.playerSeatStates.delete(client)
        }
    }

    public seats() : PlayerSeat[] {
        return Array<PlayerSeat>.from(this.playerSeats.values())
    }

    private schema : Schema.Lobby
    private playerSeats : Map<ClientWrapper, PlayerSeat>
    private playerSeatStates : Map<ClientWrapper, Schema.PlayerSeatState>

}