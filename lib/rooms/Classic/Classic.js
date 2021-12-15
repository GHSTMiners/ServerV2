"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Classic = void 0;
const colyseus_1 = require("colyseus");
const Crypto_1 = require("../shared/schemas/Crypto");
const Player_1 = require("../shared/schemas/Player");
const Block_1 = require("../shared/schemas/World/Block");
const ClassicSchema_1 = require("./schema/ClassicSchema");
class Classic extends colyseus_1.Room {
    onCreate(options) {
        this.setState(new ClassicSchema_1.ClassicSchema());
        this.maxClients = 10;
        this.onMessage("type", (client, message) => {
            //
            // handle "type" message
            //
        });
        //Generate blocks for world
        for (let index = 0; index < 40 * 1000; index++) {
            let block = new Block_1.Block();
            block.crypto = new Crypto_1.Crypto();
            this.state.world.blocks.push(new Block_1.Block());
        }
    }
    update() {
    }
    onAuth(client, options, request) {
        //Verify wallet authentication
        if (options.hasOwnProperty("wallet_address") && options.hasOwnProperty("wallet_auth_token")) {
        }
        //Check for name and gotchiID
        if ("gotchiID" in options && "name" in options) {
        }
        else
            return false;
        return true;
    }
    onJoin(client, options) {
        if ("gotchiID" in options && "name" in options) {
        }
        this.state.world.players.push(new Player_1.Player());
        console.log(client.sessionId, "joined!");
    }
    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
    }
    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
exports.Classic = Classic;
