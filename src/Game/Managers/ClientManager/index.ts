import {Client} from "colyseus"
import ClientWrapper from "../../Objects/ClientWrapper"

export default class ClientManager extends Phaser.GameObjects.GameObject{
    constructor(scene : Phaser.Scene) {
        super(scene, "ClientManager")
        this.clientWrappers = new Map<Client, ClientWrapper>()
        this.clientJoinedCallback = function(client : ClientWrapper, options : any) {}
    }

    public handleClientJoined(client: Client, options : any) {
        console.log(`New client was registered with clientManager`)
        let clientWrapper : ClientWrapper = new ClientWrapper(client);
        this.clientWrappers.set(client, clientWrapper)
        this.clientJoinedCallback(clientWrapper, options)
    }

    public handleMessage(client: Client, type: string, message: string) {
        let clientWrapper : ClientWrapper | undefined = this.clientWrappers.get(client)
        if(clientWrapper) { 
            clientWrapper.messageRouter.processRawMessage(type, message)
        }
    }

    public clientJoinedCallback : (client : ClientWrapper, options : any) => void

    private clientWrappers : Map<Client, ClientWrapper>
}