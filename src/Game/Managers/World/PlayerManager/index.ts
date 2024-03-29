import * as Schema from "../../../../Schemas"
import { Scene } from "phaser";
import Player from "../../../Objects/Player";
import ClientManager from "../../World/ClientManager";
import { Client, Room } from "colyseus";
import ClientWrapper from "../../../../Helpers/ClientWrapper";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import AavegotchiInfoFetcher, { AavegotchiTraits } from "../../../../Helpers/AavegotchiInfoFetcher";
import chroma from "chroma-js"
import MainScene from "../../../Scenes/MainScene";

export default class PlayerManager extends Phaser.GameObjects.GameObject{
    constructor(scene: MainScene, clientManager : ClientManager, room : Room<Schema.World>) {
        super(scene, "PlayerManager")
        this.room = room;
        this.playerMap = new Map<ClientWrapper, Player>()
        this.traitFetcher  = new AavegotchiInfoFetcher()
        this.chatColors = chroma.scale(['#fafa6e','#2A4858']).mode('lch').colors(room.maxClients);
        clientManager.on(ClientManager.CLIENT_JOINED, this.handleClientJoined.bind(this))
        clientManager.on(ClientManager.CLIENT_LEFT, this.handleClientLeave.bind(this))
    }


    private handleClientJoined(client : ClientWrapper, options : Protocol.AuthenticationInfo) {
        //Gotchi was now succesfull authenticated, we should also fetch its traits
        this.traitFetcher.getAavegotchi(options.gotchiId).then(gotchi => {
            console.log(`Player joined with gotchi: ${options.gotchiId}`)
            //Create new objects
            let newPlayerSchema : Schema.Player = new Schema.Player()
            const playerIndex = this.room.clients.indexOf(client.client)
            newPlayerSchema.gotchiID = options.gotchiId
            newPlayerSchema.walletAddress = options.walletAddress
            newPlayerSchema.name = gotchi.name
            const playerColor = chroma.random();
            newPlayerSchema.chatColor = this.chatColors[playerIndex];
            let newPlayerSprite : Player = new Player(this.scene as MainScene, newPlayerSchema, new AavegotchiTraits(gotchi.modifiedNumericTraits), client)
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


    private async handleClientLeave(client : ClientWrapper) {
        let player : Player | undefined = this.playerMap.get(client)
        if(player) {
            player.statisticsManager().submit().finally(() => {
                let playerIndex : number = this.room.state.players.indexOf(player.playerSchema)
                this.room.state.players.deleteAt(playerIndex)
                this.room.presence.del(`gotchi_${player.playerSchema.gotchiID}`)
                player.destroy(true)
                this.playerMap.delete(client)
                // Notify clients that a player has left
                let response : Protocol.NotifyPlayerLeftGame = new Protocol.NotifyPlayerLeftGame({gotchiId: player.playerSchema.gotchiID});
                let serializedResponse : Protocol.Message = Protocol.MessageSerializer.serialize(response);
                this.room.broadcast(serializedResponse.name, serializedResponse.data)
                this.emit(PlayerManager.PLAYER_REMOVED, player)
                setTimeout(() => {
                    client.client.leave(1000);
                }, 1000);
            })
        }
    }

    public players() : Player[] {
        return Array.from(this.playerMap.values())
    }

    public playersAt(blockPosition : Phaser.Geom.Point) : Player[] {
        let players : Player[] = []
        for (let [key, value] of this.playerMap) {
            let playerPosition : Phaser.Geom.Point = value.movementManager().blockPosition()
            if(Phaser.Geom.Point.Equals(playerPosition, blockPosition)) players.push(value)
        }
        return players
    }

    private traitFetcher : AavegotchiInfoFetcher
    private playerMap : Map<ClientWrapper, Player>
    private room : Room<Schema.World>
    private chatColors : string[]
    static readonly PLAYER_ADDED: unique symbol = Symbol();
    static readonly PLAYER_REMOVED: unique symbol = Symbol();

}
