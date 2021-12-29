import Phaser from "phaser"
import * as Colyseus from "colyseus";
import * as Schema from "../Rooms/shared/schemas/Schemas";
import MainScene from "./Scenes/MainScene";
import PlayerManager from "./Managers/PlayerManager";

export default class Game extends Phaser.Game {
    constructor(world : Schema.World) {
       const config : Phaser.Types.Core.GameConfig = {
            type: Phaser.HEADLESS,
            width: 1280,
            height: 720,
            banner: false,
            audio: {
                noAudio: true
            },
            scene: new MainScene(world),
            physics: {
              default: 'arcade',
              arcade: {
                gravity: { y: 300 }
              }
            }
        }
        super(config)
        this.events.emit(Phaser.Core.Events.READY);
    }

    public onClientJoined(client: Colyseus.Client, consented: boolean) {
      
    }

    public onClientLeave(client: Colyseus.Client, consented: boolean) {

    }
}