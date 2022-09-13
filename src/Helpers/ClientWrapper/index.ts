import { Client } from "colyseus";
import { MessageRouter } from "gotchiminer-multiplayer-protocol";
import WebRTCConnection from "../WebRTCConnection";

export default class ClientWrapper {
    constructor(client : Client) {
        this.client = client
        this.messageRouter = new MessageRouter()
        this.webRtcConnection = new WebRTCConnection("fsfds")
    }

    private webRtcConnection : WebRTCConnection
    public messageRouter : MessageRouter
    public readonly client : Client
}