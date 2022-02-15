import Phaser from "phaser"
import * as Colyseus from "colyseus";
import * as Schema from "../Rooms/shared/schemas";
import MainScene from "./Scenes/MainScene";
import PlayerManager from "./Managers/PlayerManager";
import { DetailedWorld } from "chisel-api-interface";
import { Room } from "colyseus";

export default class Game extends Phaser.Game {
    constructor(room : Room<Schema.World>, worldInfo : DetailedWorld) {
      const mainScene : MainScene = new MainScene(room, worldInfo)
       const config : Phaser.Types.Core.GameConfig = {
            type: Phaser.HEADLESS,
            fps: {
              target: 30,
              min: 30
            },
            banner: false,
            audio: {
                noAudio: true
            },
            scene: mainScene,
            physics: {
              arcade: {
                fps: 30,
              },
              default: 'arcade',
            }
        }
        super(config)
        this.mainScene = mainScene;
        this.events.emit(Phaser.Core.Events.READY);
        this.loop.start(this.headlessStep.bind(this));

    }

    public readonly mainScene : MainScene
}