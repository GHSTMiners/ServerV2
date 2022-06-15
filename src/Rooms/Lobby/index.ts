import http from "http";
import * as Schema from "../../Schemas";
import { Room, Client } from "colyseus";
import LobbyManager from "../../Lobby/LobbyManager";
import CountdownManager from "../../Lobby/CountdownManager/CountdownManager";


export class Lobby extends Room<Schema.Lobby, any> {
    // When room is initialized
    onCreate (options: any) { 
        this.setState(new Schema.Lobby())
        this.maxClients = 5
        this.lobbyManager = new LobbyManager(this)
        this.countdownManager = new CountdownManager(this, this.lobbyManager)
    }

    // Authorize client based on provided options before WebSocket handshake is complete
    onAuth (client: Client, options: any, request: http.IncomingMessage) {
        return true;
    }

    // When client successfully join the room
    onJoin (client: Client, options: any, auth: any) { 
        this.lobbyManager.handleClientJoined(client)
    }

    // When a client leaves the room
    onLeave (client: Client, consented: boolean) { 
        this.lobbyManager.handleClientLeave(client)
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose () { }

    private lobbyManager : LobbyManager
    private countdownManager : CountdownManager
}