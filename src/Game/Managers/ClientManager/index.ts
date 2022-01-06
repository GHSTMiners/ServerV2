import {Client} from "colyseus"
import ClientWrapper from "../../Objects/ClientWrapper"

export default class ClientManager extends Phaser.GameObjects.GameObject{
    constructor(scene : Phaser.Scene) {
        super(scene, "ClientManager")
        this.clientWrappers = new Map<Client, ClientWrapper>()
    }

    public handleClientJoined(client: Client, options : any) {
        console.log(`New client was registered with clientManager`)
        let clientWrapper : ClientWrapper = new ClientWrapper(client);
        this.clientWrappers.set(client, clientWrapper)
        this.emit(ClientManager.CLIENT_JOINED, clientWrapper, options)
    }

    public handleClientLeave(client : Client) {
        let clientWrapper : ClientWrapper |undefined = this.clientWrappers.get(client)
        if(clientWrapper) {
            this.clientWrappers.delete(client)
            this.emit(ClientManager.CLIENT_LEFT, clientWrapper)
        }
    }

    public handleMessage(client: Client, type: string, message: string) {
        let clientWrapper : ClientWrapper | undefined = this.clientWrappers.get(client)
        if(clientWrapper) { 
            clientWrapper.messageRouter.processRawMessage(type, message)
        }
    }

    static readonly CLIENT_JOINED: unique symbol = Symbol();
    static readonly CLIENT_LEFT: unique symbol = Symbol();
    private clientWrappers : Map<Client, ClientWrapper>
}