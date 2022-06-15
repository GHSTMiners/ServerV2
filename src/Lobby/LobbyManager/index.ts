import { Client } from "colyseus";
import * as Schema from "../../Schemas";
import ClientWrapper from "../../Game/Helpers/ClientWrapper";
import PlayerSeatManager from "../PlayerSeatManager/PlayerSeatManager";
import { Lobby } from "../../Rooms/Lobby";

export default class LobbyManager {
    constructor(room : Lobby) {
        this.room = room
        this.clientWrappers = new Map<Client, ClientWrapper>()
        this.playerSeatManager = new PlayerSeatManager(room.state)
    }

    public handleClientJoined(client : Client) {
        let clientWrapper : ClientWrapper = new ClientWrapper(client);
        this.clientWrappers.set(client, clientWrapper)
        this.playerSeatManager.handleClientJoined(clientWrapper)
    }

    public handleClientLeave(client : Client) {
        let clientWrapper : ClientWrapper | undefined = this.clientWrappers.get(client)
        if(clientWrapper) {
            this.playerSeatManager.handleClientLeave(clientWrapper)
            this.clientWrappers.delete(client)
        }
    }

    public handleMessage(client: Client, type: string, message: string) {
        let clientWrapper : ClientWrapper | undefined = this.clientWrappers.get(client)
        if(clientWrapper) { 
            clientWrapper.messageRouter.processRawMessage(type, message)
        }
    }

    public isFull() : boolean {
        return this.clientWrappers.size >= this.room.maxClients 
    }

    public seatManager() : PlayerSeatManager {
        return this.playerSeatManager
    }

    private room : Lobby
    private clientWrappers : Map<Client, ClientWrapper>
    private playerSeatManager : PlayerSeatManager

}