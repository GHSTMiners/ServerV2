import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { Server } from "@colyseus/core";
import { uWebSocketsTransport } from "@colyseus/uwebsockets-transport"
import { APIInterface } from "chisel-api-interface";
/**
 * Import your Room files
 */
import { Classic } from "./rooms/Classic/Classic";

export default Arena({
    getId: () => "Gotchiminer",

    initializeGameServer: (gameServer) => {
        let apiInterface : APIInterface = new APIInterface('https://chisel.gotchiminer.rocks/api');
        apiInterface.worlds().then(worlds => {
            worlds.forEach(world => {
                console.info(`Registering room with name ${world.name}_Classic for world with id: ${world.id}`);
                gameServer.define(`${world.name}_Classic`, Classic, {
                    worldID: world.id
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
            res.send("It's time to kick ass and chew bubblegum!");
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