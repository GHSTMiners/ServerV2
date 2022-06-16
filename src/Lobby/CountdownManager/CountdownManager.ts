import * as Schema from "../../Schemas";
import * as _ from "lodash"
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
            this.lobby.lock()
            this.lobby.state.state = LobbyState.Locked
        }

        // Start game when timer expires
        if(this.timeRemaining <= 0) {
            clearInterval(this.intervalTimer)
            this.startGame()
        }
    }

    private async startGame() {
        this.lobby.state.state = LobbyState.Starting
        // Create a histogram of the votes
        let seats : PlayerSeat[] = this.lobbyManager.seatManager().seats()
        let voteHistogram : Map<number, number> = new Map<number, number>()
        seats.forEach(seat => {
            if(voteHistogram.has(seat.mapVote())) {
                voteHistogram.set(seat.mapVote(), voteHistogram.get(seat.mapVote()))
            } else {
                voteHistogram.set(seat.mapVote(), 1)
            }
        })

        // Get map canidates that have the highest amount of votes
        let highestVoteCount : number = 0;
        let mapCandidates : Array<number>
        voteHistogram.forEach((map, voteCount) => {
            //If there is a map with more votes than previous candidates, discard all old candidates
            if(voteCount > highestVoteCount) {
                mapCandidates = []
                highestVoteCount = voteCount
            }
            if(voteCount >= highestVoteCount) {
                mapCandidates.push(map)
            }
        })

        // Pick a random map from map candidates
        let chosenMap : number = _.sample<number>(mapCandidates)

        // Create a new room
        const matchRoom = await matchMaker.createRoom(`${chosenMap}_Classic`, {});

    }

    private lobby : Lobby
    private lobbyManager : LobbyManager
    private timeRemaining : number
    private intervalTimer : NodeJS.Timer
}