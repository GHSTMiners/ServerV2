import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { Server } from "@colyseus/core";
import { uWebSocketsTransport } from "@colyseus/uwebsockets-transport"
import { APIInterface } from "chisel-api-interface";
import basicAuth from "express-basic-auth";

/**
 * Import your Room files
 */
import { Lobby, Classic } from "../Rooms";

import Config from ".";
import { ServerRegion } from "chisel-api-interface/lib/ServerRegion";

const basicAuthMiddleware = basicAuth({
    // list of users and passwords
    users: {
        "plesman": "Microflown!",
    },
    // sends WWW-Authenticate header, which will prompt the user to fill
    // credentials in
    challenge: true
});

export default Arena({
    getId: () => "Gotchiminer",

    initializeGameServer: (gameServer) => {
        let apiInterface : APIInterface = new APIInterface(Config.apiURL);
        let region : ServerRegion | null = null
        // Determine server region
        var region_id = parseInt(process.env.REGION_ID)
        apiInterface.server_region(region_id).then(fetched_region => {
            region = fetched_region
            console.log(`🚩 Running in region ${region.name}`)
        }).catch(()=>{
            process.exit(1);
        }).finally(() => {
            //Add lobby
            gameServer.define(`Lobby`, Lobby);
            //Add rooms for every map
            apiInterface.worlds().then(worlds => {
                worlds.forEach(world => {
                    console.info(`🎮 Registering room with name ${world.id}_Classic for world with name: ${world.name}`);
                    gameServer.define(`${world.id}_Classic`, Classic, {
                        worldID: world.id,
                        development_mode: world.development_mode,
                        region: region
                    });
                })
            })
        })
    },

    initializeTransport: function() {
        return new uWebSocketsTransport({
            
        })
    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (req, res) => {
            res.send("<H1>Nothing to see here fren!</H1>");
        });

        app.use("/colyseus", basicAuthMiddleware, monitor());

    },
    
});