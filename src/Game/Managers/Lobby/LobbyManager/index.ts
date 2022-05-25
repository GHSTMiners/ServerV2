import { Client } from "colyseus";
import ClientWrapper from "../../../Helpers/ClientWrapper";

export default class LobbyManager {
    constructor() {
        this.clientWrappers = new Map<Client, ClientWrapper>()
    }

    public handleClientJoined(client : Client) {
        let clientWrapper : ClientWrapper = new ClientWrapper(client);
        this.clientWrappers.set(client, clientWrapper)
    }

    public handleClientLeave(client : Client) {
        let clientWrapper : ClientWrapper | undefined = this.clientWrappers.get(client)
        if(clientWrapper) {
            this.clientWrappers.delete(client)
        }
    }

    public handleMessage(client: Client, type: string, message: string) {
        let clientWrapper : ClientWrapper | undefined = this.clientWrappers.get(client)
        if(clientWrapper) { 
            clientWrapper.messageRouter.processRawMessage(type, message)
        }
    }

    private clientWrappers : Map<Client, ClientWrapper>

}