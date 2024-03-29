import MainScene from "../../../Scenes/MainScene"
import PlayerManager from "../../World/PlayerManager"
import * as Protocol from "gotchiminer-multiplayer-protocol"
import Player from "../../../Objects/Player"

export default class ChatManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, playerManager : PlayerManager) {
        super(scene, "ChatManager") 
        this.mainScene = scene
        this.playerManager = playerManager
        this.playerManager.on(PlayerManager.PLAYER_ADDED, this.handlePlayerJoined.bind(this))
        this.playerManager.on(PlayerManager.PLAYER_REMOVED, this.handlePlayerExit.bind(this))
    }

    private handlePlayerJoined(player : Player) {
        var self = this;
        // Create message handler
        player.client().messageRouter.addRoute(Protocol.MessageToServer, message => {
            self.handleMessageToServer(player, message);
        })
        this.broadCastMessage(`Player ${player.playerSchema.name} has entered the game`)
    }

    private handlePlayerExit(player : Player) {
        this.broadCastMessage(`Player ${player.playerSchema.name} has left the game`)
    }

    public broadCastMessage(message : string) {
        let response : Protocol.MessageFromServer = new Protocol.MessageFromServer();
        response.msg = message;
        response.systemMessage = true;
        let serializedResponse : Protocol.Message = Protocol.MessageSerializer.serialize(response);
        this.mainScene.room.broadcast(serializedResponse.name, serializedResponse.data)
    }

    private handleMessageToServer(player : Player, message : Protocol.MessageToServer) {
        let response : Protocol.MessageFromServer = new Protocol.MessageFromServer();
        response.msg = message.msg; //this.badWordsFilter.clean(message.msg);
        response.gotchiId = player.playerSchema.gotchiID;
        response.systemMessage = false;
        let serializedResponse : Protocol.Message = Protocol.MessageSerializer.serialize(response);
        this.mainScene.room.broadcast(serializedResponse.name, serializedResponse.data);   
        this.emit(ChatManager.RECEIVED_MESSAGE, response.msg, player)
    }

    private mainScene : MainScene
    private playerManager : PlayerManager
    static readonly RECEIVED_MESSAGE: unique symbol = Symbol();

}