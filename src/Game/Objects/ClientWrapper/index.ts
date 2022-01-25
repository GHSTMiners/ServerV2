import { Client } from "colyseus";
import { MessageRouter } from "gotchiminer-multiplayer-protocol";
import * as werift from "werift"
export default class ClientWrapper {
    constructor(client : Client) {
        this.client = client
        this.messageRouter = new MessageRouter()
        this.peer = new werift.RTCPeerConnection (
            {
                iceServers: [
                    {urls: "stun:stun1.l.google.com:19302"}
                ]
                
            }
        )
    }

    public peer  : werift.RTCPeerConnection
    public messageRouter : MessageRouter
    public readonly client : Client
}