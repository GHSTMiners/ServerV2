import { Room, Client, ServerError } from "colyseus";
import WorldGenerator from "../../Generators/WorldGenerator";
import * as Schema from "../shared/schemas";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import http from 'http';
import Game from "../../Game";
import AavegotchiInfoFetcher from "../../Game/Helpers/AavegotchiInfoFetcher";
import { APIInterface } from "chisel-api-interface";

export class Classic extends Room<Schema.World> {

  onCreate (options:any) {
    this.setState(new Schema.World());
    this.maxClients = 10;
    this.state.id = options.worldID;
    //Generate blocks for world
    var self = this;
    let apiInterface = new APIInterface('https://chisel.gotchiminer.rocks/api')
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
      let traitFetcher : AavegotchiInfoFetcher = new AavegotchiInfoFetcher()
      //Check that both fields are filled
      if(options.gotchiId  && options.walletAddress) { 
        //Verify that gotchi is not already playing
        
          if(this.presence.get(`gotchi_${options.gotchiId.toString()}`)) {
            console.warn(`Reject gotchi ${options.gotchiId}, on IP ${request.socket.remoteAddress} because it is already playing`)
            reject(new ServerError(400, "This aavegotchi is already mining!"))
          } else {
            //Get owner for gotchi ID
            traitFetcher.getAavegotchiOwner(options.gotchiId).then(owner => {
              //Check if owner wallet matches authentication wallet address
              if(owner == options.walletAddress) {
                resolve(true)
              } else {
                console.warn(`Wallet ${options.walletAddress} tried to authenticate with an unowned aavegotchi ${options.gotchiId}, on IP ${request.socket.remoteAddress}`)
                reject(new ServerError(400, "You're not the owner of this aavegotchi!"))
              }
            }).catch(error => {
              //Failed to fetch traits
              reject(new ServerError(500, "Failed get owner adress for aavegotchi"))
            })
          }
      } else reject(new ServerError(400, "Authentication info is missing data"))
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
  }
  private game : Game
}
