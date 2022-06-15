import * as Schema from "../../Schemas";
import { LobbyState } from "../../Schemas";
import { matchMaker } from "colyseus";
import { Lobby } from "../../Rooms";
import LobbyManager from "../LobbyManager";
import PlayerSeat from "../PlayerSeat/PlayerSeat";
import { max, number } from "mathjs";

export default class CountdownManager {
    constructor(lobby : Lobby, lobbyManager : LobbyManager) {
        this.lobby = lobby
        this.lobbyManager = lobbyManager
        this.intervalTimer = setInterval(this.handleCountDown.bind(this), 1000)
        this.timeRemaining = 300
    }

    private handleCountDown() {
        // Drop timer to 15 second when lobby is full
        if(this.timeRemaining > 15 && this.lobbyManager.isFull()) {
            this.timeRemaining = 15
        } else this.timeRemaining = this.timeRemaining - 1


        // Lock loby at 15 seconds remaining
        if(this.timeRemaining == 15) {
            this.lobby.state.state = LobbyState.Locked
        }

        // Start game when timer expires
        if(this.timeRemaining <= 0) {
            clearInterval(this.intervalTimer)
            this.lobby.state.state = LobbyState.Starting
            this.startGame()
        }
    }

    private startGame() {
        // Get map with most votes
        let seats : PlayerSeat[] = this.lobbyManager.seatManager().seats()
        let scores = Array<number>()
        seats.forEach(seat => {
            scores.push(seat.mapVote())
        })
        histogram(scores)

        matchMaker.createRoom()
    }

    private lobby : Lobby
    private lobbyManager : LobbyManager
    private timeRemaining : number
    private intervalTimer : NodeJS.Timer
}