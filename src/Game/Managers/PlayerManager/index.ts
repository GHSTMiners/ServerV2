import * as Schema from "../../../Rooms/shared/schemas"
import { Scene } from "phaser";
import Player from "../../Objects/Player";
import ClientManager from "../ClientManager";
import { Client, Room } from "colyseus";
import ClientWrapper from "../../Objects/ClientWrapper";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import AavegotchiInfoFetcher from "../../Helpers/AavegotchiInfoFetcher";

export default class PlayerManager extends Phaser.GameObjects.GameObject{
    constructor(scene: Scene, clientManager : ClientManager, room : Room<Schema.World>) {
        super(scene, "PlayerManager")
        this.room = room;
        this.playerMap = new Map<ClientWrapper, Player>()
        this.traitFetcher  = new AavegotchiInfoFetcher()
        clientManager.on(ClientManager.CLIENT_JOINED, this.handleClientJoined.bind(this))
        clientManager.on(ClientManager.CLIENT_LEFT, this.handleClientLeave.bind(this))
    }

    private handleClientJoined(client : ClientWrapper, options : Protocol.AuthenticationInfo) {
        //Gotchi was now succesfull authenticated, we should also fetch its traits
        this.traitFetcher.getAavegotchiTraits(options.gotchiId).then(traits => {
            console.log(`Player joined with gotchi: ${options.gotchiId}`)
            //Create new objects
            let newPlayerSchema : Schema.Player = new Schema.Player()
            client.client.userData = newPlayerSchema
            newPlayerSchema.gotchiID = options.gotchiId
            let newPlayerSprite : Player = new Player(this.scene, newPlayerSchema, traits, client)
            newPlayerSchema.playerSessionID = client.client.sessionId
            //Add new object to game server logic
            this.room.state.players.push(newPlayerSchema)
            this.scene.add.existing(newPlayerSprite)
            this.playerMap.set(client, newPlayerSprite)
            this.room.presence.incr(`gotchi_${options.gotchiId}`)
            this.emit(PlayerManager.PLAYER_ADDED, newPlayerSprite)
        }).catch(error =>{
            console.log(error);
            
            client.client.leave(500, "Could not fetch traits for this Aavegotchi")
        })
    }

    private handleClientLeave(client : ClientWrapper) {
        let player : Player | undefined = this.playerMap.get(client)
        if(player) {
            let playerIndex : number = this.room.state.players.indexOf(player.playerSchema)
            this.room.state.players.deleteAt(playerIndex)
            this.room.presence.del(`gotchi_${player.playerSchema.gotchiID}`)
            player.destroy(true)
            this.playerMap.delete(client)
            this.emit(PlayerManager.PLAYER_REMOVED, player)
        }
    }

    private traitFetcher : AavegotchiInfoFetcher
    private playerMap : Map<ClientWrapper, Player>
    private room : Room<Schema.World>
    static readonly PLAYER_ADDED: unique symbol = Symbol();
    static readonly PLAYER_REMOVED: unique symbol = Symbol();

}