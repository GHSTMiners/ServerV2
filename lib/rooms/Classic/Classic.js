"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Classic = void 0;
const colyseus_1 = require("colyseus");
const WorldGenerator_1 = __importDefault(require("../../Generators/WorldGenerator"));
const Player_1 = require("../shared/schemas/Player");
const World_1 = require("../shared/schemas/World/World");
const Game_1 = __importDefault(require("../../Game"));
class Classic extends colyseus_1.Room {
    onCreate(options) {
        this.setState(new World_1.World());
        this.maxClients = 10;
        this.state.id = options.worldID;
        //Generate blocks for world
        let worldGenerator = new WorldGenerator_1.default(options.worldID, this.state.blocks);
        this.clientPlayerMap = new Map();
        this.game = new Game_1.default();
    }
    update() {
    }
    onAuth(client, options, request) {
        console.info(`User with IP ${request.socket.remoteAddress} authenticating`);
        //Verify wallet authentication
        // if(options.hasOwnProperty("wallet_address") && options.hasOwnProperty("wallet_auth_token")){
        // }
        // //Check for name and gotchiID
        // if("gotchiID" in options && "name" in options ){
        // } else return false;
        // return true;
        return true;
    }
    onJoin(client, options) {
        let newPlayer = new Player_1.Player();
        this.clientPlayerMap.set(client.id, newPlayer);
        this.state.players.push(newPlayer);
        console.log(`${client.id}, joined!`);
    }
    onLeave(client, consented) {
        let player = this.clientPlayerMap.get(client.id);
        this.state.players.deleteAt(this.state.players.indexOf(player));
        this.clientPlayerMap.delete(client.id);
        console.log(client.sessionId, "left!");
    }
    onDispose() {
        console.log("Room", this.roomId, "disposing...");
    }
}
exports.Classic = Classic;
