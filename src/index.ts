/**
 * IMPORTANT: 
 * ---------
 * Do not manually edit this file if you'd like to use Colyseus Arena
 * 
 * If you're self-hosting (without Arena), you can manually instantiate a
 * Colyseus Server as documented here: 👉 https://docs.colyseus.io/server/api/#constructor-options 
 */
import { listen } from "@colyseus/arena";
import { Server, RedisPresence, MongooseDriver } from "colyseus"
import { uWebSocketsTransport } from "@colyseus/uwebsockets-transport"
import express from "express";
import expressify from "uwebsockets-express"

const globalJsdom = require('global-jsdom')
globalJsdom('', {pretendToBeVisual: true})

document.body.innerHTML = 'hello'

var env = process.env.NODE_ENV || 'development';

// Import arena config
import arenaDevConfig from "./Config/arena.config.dev";
import arenaConfig from "./Config/arena.config";

// Create and listen on 2567 (or PORT environment variable.)
var env = process.env.NODE_ENV || 'development';

if(env == "production") {
    //Configure redis
    var redisPresence = new RedisPresence(
        {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
        }
    )

    //Configure Mongoose
    var mongooseDrive = new MongooseDriver(process.env.MONGOOSE_URI || 'mongodb://localhost:27017/gotchiminer');

    //Configure transport
    var transport = new uWebSocketsTransport();
    
    //Intialize express webserver
    const app = expressify(transport.app);

    //Register express route
    app.get("/", (req, res) => {
      res.send("<H1>Nothing to see here fren!</H1>");
    });
    
    //Configure game server
    const port = parseInt(process.env.PORT, 10) || 2567
    const gameServer = new Server(
        {
            presence: redisPresence,
            driver: mongooseDrive,
            transport: transport,
        }
    )
    gameServer.listen(port)

    arenaConfig.initializeGameServer(gameServer)

    process.on('SIGTERM', () => {
        console.log('Shutting down gracefully')
        const shutdown = gameServer.gracefullyShutdown(true)
    });
} else {
    listen(arenaDevConfig);
}
