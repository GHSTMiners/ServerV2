"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const arena_1 = __importDefault(require("@colyseus/arena"));
const monitor_1 = require("@colyseus/monitor");
const chisel_api_interface_1 = require("chisel-api-interface");
/**
 * Import your Room files
 */
const Classic_1 = require("./rooms/Classic/Classic");
exports.default = arena_1.default({
    getId: () => "Gotchiminer",
    initializeGameServer: (gameServer) => {
        let apiInterface = new chisel_api_interface_1.APIInterface('https://chisel.gotchiminer.rocks/api');
        apiInterface.worlds().then(worlds => {
            worlds.forEach(world => {
                console.info(`Registering room with name ${world.name}_Classic for world with id: ${world.id}`);
                gameServer.define(`${world.name}_Classic`, Classic_1.Classic, {
                    worldID: world.id
                });
            });
        });
    },
    // initializeTransport: function() {
    //     return new uWebSocketsTransport({
    //         /* options */
    //     })
    //   },
    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });
        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", monitor_1.monitor());
    },
    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
