import MainScene from "../../../Scenes/MainScene"
import ChatManager from "../ChatManager"

export default class DevCommandManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, chatManager : ChatManager) {
        super(scene, "ClientManager")
        this.mainScene = scene
        chatManager.on(ChatManager.RECEIVED_MESSAGE, (msg : string) => this.processMessage(msg))
    }

    private processMessage(message : string) {
        if(message.startsWith('/')) {
            switch(message.substring(1)) {
                case "endgame":
                    return this.endGame()
            }
        }
    }

    private endGame() {
        this.mainScene.playTimeManager.terminate()
    }
    private mainScene : MainScene
}