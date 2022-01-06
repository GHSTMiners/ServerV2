import { Room, Client } from "colyseus";
import WorldGenerator from "../../Generators/WorldGenerator";
import * as Schema from "../shared/schemas";

import http from 'http';
import Game from "../../Game";
import AavegotchiTraitFetcher from "../../Game/Helpers/AavegotchiTraitFetcher";

export class Classic extends Room<Schema.World> {

  onCreate (options:any) {
    this.setState(new Schema.World());
    this.maxClients = 10;
    this.state.id = options.worldID;
    let traitFetcher : AavegotchiTraitFetcher = new AavegotchiTraitFetcher()
    traitFetcher.getAavegotchiOwner(22536).then(owner => {
      console.log(owner)
    })
    traitFetcher.getAavegotchiTraits(22536).then(traits => {
      console.log(traits)
    })

    //Generate blocks for world
    var self = this;
    WorldGenerator.generateWorld(options.worldID, this.state).then(nothing =>{
      //Create game
      self.game = new Game(this.state)
      //Register message handler 
      this.onMessage("*", (client: Client, type: string | number, message: string) => this.game.mainScene.clientManager.handleMessage(client, type as string, message))
      //Register clients with clientmanager
      this.clients.forEach(client => {
        this.game.mainScene.clientManager.handleClientJoined(client, null)
      }, this)
      //Start running the engine loop
      self.setPatchRate(0)
      self.setSimulationInterval((deltaTime) => this.update(deltaTime))
    })

  }

  update(delta : number): void {
    this.game.headlessStep(Date.now(), delta)
    this.broadcastPatch()
  }

  onAuth(client: Client, options: object, request: http.IncomingMessage) {
    console.info(`User with IP ${request.socket.remoteAddress} authenticating`)
    //Verify wallet authentication
    // if(options.hasOwnProperty("wallet_address") && options.hasOwnProperty("wallet_auth_token")){

    // }

    // //Check for name and gotchiID
    // if("gotchiID" in options && "name" in options ){
      
    // } else return false;
    // return true;
    return true;
  }
  
  onJoin (client: Client, options: any) {
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
