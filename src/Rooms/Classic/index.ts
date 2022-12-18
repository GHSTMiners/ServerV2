import { Room, Client, ServerError } from "colyseus";
import WorldGenerator from "../../Game/Generators/WorldGenerator";
import * as Schema from "../../Schemas";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import http from 'http';
import Game from "../../Game";
import { APIInterface } from "chisel-api-interface";
import Authenticator, { AuthenticatorState } from "../../Helpers/Authenticator";
import Config from "../../Config";
import Logging from "../../Helpers/Logging";
import {v4 as uuidv4} from 'uuid';
import needle from "needle"

export class Classic extends Room<Schema.World, any> {

  async generateRoomId(worldID:number): Promise<string> {
    let postdata : any = {}
    postdata.world_id = worldID
    if(process.env.REGION_ID) {
      postdata.server_region_id = this.state.serverRegionId
    }

    return needle('post', `${Config.apiURL}/game/create` , postdata, {
      headers: {
          'X-API-Key': Config.apiKey
      }
    }).then(response => {
      return response.body.room_id as string;
    })
    .catch(exception=> {
        console.warn(exception);
        return "";
    })
}

  async onCreate (options:any) {
    this.setState(new Schema.World());
    this.maxClients = 5;
    this.state.id = options.worldID;
    this.state.serverRegionId = parseInt(process.env.REGION_ID)
    this.roomId = await this.generateRoomId(options.worldID);

    this.development_mode = options.development_mode
    if(options.password) {
      this.setPrivate(true)
      this.password = options.password
    }
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
      if(this.password.length > 0 ) {
        if(options.password != this.password) {
          Logging.submitEvent("Player didn't know the password to the room", 500, request, options.gotchiId, options.walletAddress)
          reject(new ServerError(400, "Invalid password"))
          return;
        }
      }
      let authenticator : Authenticator = new Authenticator(this.presence, options, request)
      authenticator.authenticate_full().then(result => {
        if(result == AuthenticatorState.Authenticated) {
          client.userData = authenticator.roles()
          Logging.submitEvent("Player succesfully authenticated", 0, request, options.gotchiId, options.walletAddress);
          if(this.development_mode) {
            if(authenticator.roles().developer) {
              resolve(true)
            } else reject(new ServerError(400, "You can only play maps in development mode if you are an developer"))
          } 
          resolve(true)
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

  async onDispose() {
    const result = await this.game.mainScene.loggingManager.upload()
    console.log("Room", this.roomId, "disposing...");
    this.game.destroy(false, false)
  }
  private game : Game
  private password : string
  private development_mode : boolean
}
