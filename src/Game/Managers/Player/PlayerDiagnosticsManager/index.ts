import * as Protocol from "gotchiminer-multiplayer-protocol";
import Player from "../../../Objects/Player";

export default class PlayerDiagnosticsManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerDiagnosticsManager")
        scene.add.existing(this)
        this.player = player
        player.client().messageRouter.addRoute(Protocol.ActivateBuilding, this.handlePingMessage.bind(this))       
    }


    private handlePingMessage() {
        //Notify player that transaction failed
        let pongMessage : Protocol.Pong = new Protocol.Pong()
        let serializedMessage : Protocol.Message = Protocol.MessageSerializer.serialize(pongMessage)
        this.player.client().client.send(serializedMessage.name, serializedMessage.data)
    }
    
    private player : Player
}