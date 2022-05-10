import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { Server } from "@colyseus/core";
import { uWebSocketsTransport } from "@colyseus/uwebsockets-transport"
import { APIInterface } from "chisel-api-interface";
/**
 * Import your Room files
 */
import { Lobby, Classic } from "./Rooms";
import Config from "./Config";

export default Arena({
    getId: () => "Gotchiminer",

    initializeGameServer: (gameServer) => {
        //Add lobby
        gameServer.define(`Lobby`, Lobby);
        //Add rooms for every map
        let apiInterface : APIInterface = new APIInterface(Config.apiURL);
        apiInterface.worlds().then(worlds => {
            worlds.forEach(world => {
                console.info(`Registering room with name ${world.name}_Classic for world with id: ${world.id}`);
                gameServer.define(`${world.name}_Classic`, Classic, {
                    worldID: world.id,
                    development_mode: world.development_mode
                });
            })
        })

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
            res.send("Nothing here fren!");
        });

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});