import Phaser from "phaser"
import * as Colyseus from "colyseus";
import * as Schema from "../Schemas";
import MainScene from "./Scenes/MainScene";
import PlayerManager from "./Managers/World/PlayerManager";
import { DetailedWorld } from "chisel-api-interface";
import { Room } from "colyseus";

export default class Game extends Phaser.Game {
    constructor(room : Room<Schema.World>, worldInfo : DetailedWorld) {
      const mainScene : MainScene = new MainScene(room, worldInfo)
       const config : Phaser.Types.Core.GameConfig = {
            type: Phaser.HEADLESS,
            banner: false,
            
            audio: {
                noAudio: true
            },
            scene: mainScene,
            physics: {
              default: 'arcade',
              arcade: {
                
              }
            }
        }
        super(config)
        this.mainScene = mainScene;
        this.events.emit(Phaser.Core.Events.READY);
        this.loop.start(this.headlessStep.bind(this));

    }

    public readonly mainScene : MainScene
}
