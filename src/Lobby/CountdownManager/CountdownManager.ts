import * as Schema from "../../Schemas";
import * as _ from "lodash"
import { LobbyState } from "../../Schemas";
import { matchMaker } from "colyseus";
import { Lobby } from "../../Rooms";
import LobbyManager from "../LobbyManager";
import PlayerSeat from "../PlayerSeat/PlayerSeat";
import { APIInterface, World } from "chisel-api-interface";
import Config from "../../Config";

export default class CountdownManager {
    constructor(lobby : Lobby, lobbyManager : LobbyManager) {
        this.lobby = lobby
        this.lobbyManager = lobbyManager
        this.intervalTimer = setInterval(this.handleCountDown.bind(this), 1000)
        this.timeRemaining = 30
    }

    private handleCountDown() {
        // Drop timer to 15 second when lobby is full
        if(this.timeRemaining > 15 && this.lobbyManager.isFull()) {
            this.timeRemaining = 15
        } else this.timeRemaining = this.timeRemaining - 1

        // Sync with schema
        this.lobby.state.countdown = this.timeRemaining

        // Lock loby at 15 seconds remaining
        if(this.timeRemaining == 15) {
            this.lobby.lock()
            this.pickMap()
            this.lobby.state.state = LobbyState.Locked
        }

        // Start game when timer expires
        if(this.timeRemaining <= 0) {
            clearInterval(this.intervalTimer)
            this.startGame()
        }
    }

    private async pickMap() {
        // Create a histogram of the votes
        let seats : PlayerSeat[] = this.lobbyManager.seatManager().seats()
        let voteHistogram : Map<number, number> = new Map<number, number>()
        seats.forEach(seat => {
            if(seat.mapVote() != -1) {
                if(voteHistogram.has(seat.mapVote())) {
                    voteHistogram.set(seat.mapVote(), voteHistogram.get(seat.mapVote()))
                } else {
                    voteHistogram.set(seat.mapVote(), 1)
                }
            }
        })

        // Get map candidates that have the highest amount of votes
        let highestVoteCount : number = 0;
        let mapCandidates : Array<number>
        voteHistogram.forEach((voteCount, map) => {
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
        let chosenMap : number | undefined = _.sample<number>(mapCandidates)

        if(!chosenMap) {
            let apiInterface = new APIInterface(Config.apiURL)
            //Fetch world information
            let worlds : World[] = await apiInterface.worlds()
            // Pick a random map from map candidates
            let chosenMap : World | undefined = _.sample<World>(worlds)

            this.chosenMap = chosenMap.id
        } else {
            this.chosenMap = chosenMap
        }
        this.lobby.state.map_id = this.chosenMap
    }

    private async startGame() {
        this.lobby.state.state = LobbyState.Starting
        // Create a new room
        const matchRoom = await matchMaker.createRoom(`${this.chosenMap}_Classic`, {});
        // Sync with schema
        this.lobby.state.game_id = matchRoom.roomId
        this.lobby.state.state = LobbyState.Started
    }

    private lobby : Lobby
    private chosenMap : number
    private lobbyManager : LobbyManager
    private timeRemaining : number
    private intervalTimer : NodeJS.Timer
}