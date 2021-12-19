import Phaser, { Events } from "phaser"
import MainScene from "./Scenes/MainScene";

export default class Game extends Phaser.Game {
    constructor() {
       const config : Phaser.Types.Core.GameConfig = {
            type: Phaser.HEADLESS,
            width: 1280,
            height: 720,
            banner: false,
            audio: {
                noAudio: true
            },
            scene: [MainScene],
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
}