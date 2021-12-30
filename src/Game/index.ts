import Phaser from "phaser"
import * as Colyseus from "colyseus";
import * as Schema from "../Rooms/shared/schemas/Schemas";
import MainScene from "./Scenes/MainScene";
import PlayerManager from "./Managers/PlayerManager";

export default class Game extends Phaser.Game {
    constructor(world : Schema.World) {
      const mainScene : MainScene = new MainScene(world)
       const config : Phaser.Types.Core.GameConfig = {
            type: Phaser.HEADLESS,
            width: 1280,
            height: 720,
            banner: false,
            audio: {
                noAudio: true
            },
            scene: mainScene,
            physics: {
              default: 'arcade',
              arcade: {
                gravity: { y: 0 }
              }
            }
        }
        super(config)
        this.mainScene = mainScene;
        this.events.emit(Phaser.Core.Events.READY);
    }

    public onClientJoined(client: Colyseus.Client, consented: boolean) {
      
    }

    public onClientLeave(client: Colyseus.Client, consented: boolean) {

    }

    public readonly mainScene : MainScene
}