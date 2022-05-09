import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { Server } from "@colyseus/core";
import { uWebSocketsTransport } from "@colyseus/uwebsockets-transport"
import { APIInterface } from "chisel-api-interface";
/**
 * Import your Room files
 */
import { Classic } from "./Rooms/Classic";
import Config from "./Config";

export default Arena({
    getId: () => "Gotchiminer",

    initializeGameServer: (gameServer) => {
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

    initializeTransport: function() {
        return new uWebSocketsTransport({
            
        })
    },

    
    
});