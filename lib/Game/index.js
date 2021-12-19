"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const phaser_1 = __importDefault(require("phaser"));
require("@geckos.io/phaser-on-nodejs");
const jsdom_1 = require("jsdom");
//Configure navigator 
// set the fps you need
const FPS = 30;
global.phaserOnNodeFPS = FPS; // default is 60
//@ts-ignore
window = new jsdom_1.JSDOM(`...`);
const config = {
    type: phaser_1.default.HEADLESS,
    width: 1280,
    height: 720,
    banner: false,
    audio: {
        noAudio: true
    },
    // scene: [MainScene],
    fps: {
        target: FPS
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }
        }
    },
    transparent: false,
    disableContextMenu: true
};
class Game {
    constructor() {
        // this.game = new Phaser.Game(this.config);
    }
}
exports.default = Game;
