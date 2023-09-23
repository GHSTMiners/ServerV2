import { Client } from "colyseus";
import { MessageRouter } from "gotchiminer-multiplayer-protocol";
import WebRTCConnection from "../WebRTCConnection";

export default class ClientWrapper {
    constructor(client : Client) {
        this.client = client
        this.messageRouter = new MessageRouter()
     
    }
    
    public messageRouter : MessageRouter
    public readonly client : Client
}