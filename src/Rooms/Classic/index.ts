import { Room, Client, ServerError } from "colyseus";
import WorldGenerator from "../../Generators/WorldGenerator";
import * as Schema from "../../Schemas";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import http from 'http';
import Game from "../../Game";
import { APIInterface } from "chisel-api-interface";
import Authenticator, { AuthenticatorState } from "../../Game/Helpers/Authenticator";
import Config from "../../Config";
import Logging from "../../Game/Helpers/Logging";
import {v4 as uuidv4} from 'uuid';
import axios from "axios"

export class Classic extends Room<Schema.World, any> {

  async generateRoomId(worldID:number): Promise<string> {
    return axios.post(`${Config.apiURL}/game/create` , {world_id: worldID}, {
      headers: {
          'X-API-Key': Config.apiKey
      }
  }).then(value => {
    return value.data.room_id as string;
  })
  .catch(exception=> {
      console.warn(exception);
      return "";
  })
}

  async onCreate (options:any) {
    this.roomId = await this.generateRoomId(options.worldID);
    this.setState(new Schema.World());
    this.maxClients = 10;
    this.state.id = options.worldID;
    this.development_mode = options.development_mode
    //Generate blocks for world
    var self = this;
    let apiInterface = new APIInterface(Config.apiURL)
    //Fetch world information
    apiInterface.world(options.worldID).then(worldInfo => {
      //Generate a random map
      WorldGenerator.generateWorld(worldInfo, this.state).then((nothing) =>{
        //Create game
        self.game = new Game(this, worldInfo)
        //Register message handler 
        this.onMessage("*", (client: Client, type: string | number, message: string) => this.game.mainScene.clientManager.handleMessage(client, type as string, message))
        //Start running the engine loop
        self.setPatchRate(0)
        self.game.mainScene.events.on(Phaser.Scenes.Events.POST_UPDATE, self.broadcastPatch.bind(this))
    })
  })
  }

  onAuth(client: Client, options: Protocol.AuthenticationInfo, request: http.IncomingMessage) : Promise<any>{
    return new Promise((resolve, reject) => {
      let authenticator : Authenticator = new Authenticator(this.presence, options, request)
      authenticator.authenticate().then(result => {
        if(result == AuthenticatorState.Authenticated) {
          Logging.submitEvent("Player succesfully authenticated", 0, request, options.gotchiId, options.walletAddress);
          if(this.development_mode) {
            if(authenticator.roles().developer) {
              resolve(true)
            } else reject(new ServerError(400, "You can only play maps in development mode if you are an developer"))
          } resolve(true)
        }
        else {
          reject(new ServerError(400, authenticator.failedReason()) )
        }
      })
    });
  }
  
  onJoin (client: Client, options: Protocol.AuthenticationInfo) {
    if(this.game) {
      this.game.mainScene.clientManager.handleClientJoined(client, options)
    } else {
      console.debug("MainScene was not created yet, not forwarding join event to clientManager")
    }
  }

  onLeave (client: Client, consented: boolean) {
    if(this.game) {
      this.game.mainScene.clientManager.handleClientLeave(client)
    } else {
      console.debug("MainScene was not created yet, not forwarding leave event to clientManager")
    }
  }

  onDispose() {
    console.log("Room", this.roomId, "disposing...");
    this.game.destroy(false, false)
  }
  private game : Game
  private development_mode : boolean
}
