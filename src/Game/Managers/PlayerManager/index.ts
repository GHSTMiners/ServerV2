import * as Schema from "../../../Rooms/shared/schemas/Schemas"
import { Scene } from "phaser";
import Player from "../../Objects/Player";
import ClientManager from "../ClientManager";
import { Client } from "colyseus";
import ClientWrapper from "../../Objects/ClientWrapper";
export default class PlayerManager extends Phaser.GameObjects.GameObject{
    constructor(scene: Scene, clientManager : ClientManager, worldSchema : Schema.World) {
        super(scene, "PlayerManager")
        this.worldSchema = worldSchema;
        this.playerMap = new Map<ClientWrapper, Player>()
        clientManager.on(ClientManager.CLIENT_JOINED, this.handleClientJoined.bind(this))
        clientManager.on(ClientManager.CLIENT_LEFT, this.handleClientLeave.bind(this))
    }

    private handleClientJoined(client : ClientWrapper, options : any) {
        //Create new objects
        let newPlayerSchema : Schema.Player = new Schema.Player()
        let newPlayerSprite : Player = new Player(this.scene, newPlayerSchema, client)
        newPlayerSchema.playerSessionID = client.client.sessionId
        //Add new object to game server logic
        this.worldSchema.players.push(newPlayerSchema)
        this.scene.add.existing(newPlayerSprite)
        this.playerMap.set(client, newPlayerSprite)
        this.emit(PlayerManager.PLAYER_ADDED, newPlayerSprite)
    }

    private handleClientLeave(client : ClientWrapper) {
        let player : Player | undefined = this.playerMap.get(client)
        if(player) {
            let playerIndex : number = this.worldSchema.players.indexOf(player.playerSchema)
            this.worldSchema.players.deleteAt(playerIndex)
            player.destroy(true)
            this.playerMap.delete(client)
            this.emit(PlayerManager.PLAYER_REMOVED, player)
        }
    }

    private playerMap : Map<ClientWrapper, Player>
    private worldSchema : Schema.World
    static readonly PLAYER_ADDED: unique symbol = Symbol();
    static readonly PLAYER_REMOVED: unique symbol = Symbol();

}