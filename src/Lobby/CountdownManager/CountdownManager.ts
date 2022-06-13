import * as Schema from "../../Schemas";
import { LobbyState } from "../../Schemas";
import { matchMaker } from "colyseus";

export default class CountdownManager {
    constructor(lobbyState : Schema.Lobby) {
        this.lobbyState = lobbyState
        this.intervalTimer = setInterval(this.handleCountDown.bind(this), 1000)
        this.timeRemaining = 300
    }

    private handleCountDown() {
        this.timeRemaining = this.timeRemaining - 1

        // Lock loby at 15 seconds remaining
        if(this.timeRemaining == 15) {
            this.lobbyState.state = LobbyState.Locked
        }

        // Start game when timer expires
        if(this.timeRemaining <= 0) {
            clearInterval(this.intervalTimer)
            this.lobbyState.state = LobbyState.Starting
            this.startGame()
        }
    }

    private startGame() {
        matchMaker.createRoom
    }

    private timeRemaining : number
    private lobbyState : Schema.Lobby
    private intervalTimer : NodeJS.Timer
}