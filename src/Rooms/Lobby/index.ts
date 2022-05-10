import http from "http";
import * as Schema from "../../Schemas";
import { Room, Client } from "colyseus";

export class Lobby extends Room<Schema.Lobby, any> {
    // When room is initialized
    onCreate (options: any) { 
        this.setState(new Schema.Lobby())
        this.maxClients = 5
    }

    // Authorize client based on provided options before WebSocket handshake is complete
    onAuth (client: Client, options: any, request: http.IncomingMessage) { }

    // When client successfully join the room
    onJoin (client: Client, options: any, auth: any) { }

    // When a client leaves the room
    onLeave (client: Client, consented: boolean) { }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose () { }
}