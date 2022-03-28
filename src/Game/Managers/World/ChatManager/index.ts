import MainScene from "../../../Scenes/MainScene"
import PlayerManager from "../../World/PlayerManager"
import * as Protocol from "gotchiminer-multiplayer-protocol"
import Player from "../../../Objects/Player"
import BadWordsFilter from "bad-words"
export default class ChatManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, playerManager : PlayerManager) {
        super(scene, "ChatManager") 
        this.mainScene = scene
        this.playerManager = playerManager
        this.badWordsFilter = new BadWordsFilter({emptyList: false});
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
        response.msg = this.badWordsFilter.clean(message.msg);
        response.gotchiId = player.playerSchema.gotchiID;
        response.systemMessage = false;
        let serializedResponse : Protocol.Message = Protocol.MessageSerializer.serialize(response);
        this.mainScene.room.broadcast(serializedResponse.name, serializedResponse.data)
    }

    private mainScene : MainScene
    private playerManager : PlayerManager
    private badWordsFilter : BadWordsFilter
}