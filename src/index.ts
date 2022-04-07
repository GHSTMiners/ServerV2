/**
 * IMPORTANT: 
 * ---------
 * Do not manually edit this file if you'd like to use Colyseus Arena
 * 
 * If you're self-hosting (without Arena), you can manually instantiate a
 * Colyseus Server as documented here: 👉 https://docs.colyseus.io/server/api/#constructor-options 
 */
import { listen } from "@colyseus/arena";

const globalJsdom = require('global-jsdom')
globalJsdom('', {pretendToBeVisual: true})

document.body.innerHTML = 'hello'

var env = process.env.NODE_ENV || 'development';

// Import arena config
import arenaDevConfig from "./arena.config.dev";
import arenaConfig from "./arena.config";

// Create and listen on 2567 (or PORT environment variable.)
var env = process.env.NODE_ENV || 'development';

if(env == "production") {
    listen(arenaConfig);
} else {
    listen(arenaDevConfig);
}
