import { Room, Client } from "colyseus";
import WorldGenerator from "../../Generators/WorldGenerator";
import * as Schema from "../shared/schemas/Schemas";

import http from 'http';
import Game from "../../Game";

export class Classic extends Room<Schema.World> {

  onCreate (options:any) {
    this.setState(new Schema.World());
    this.maxClients = 10;
    this.state.id = options.worldID;
    this.clientPlayerMap = new Map<string, Schema.Player>()

    //Generate blocks for world
    var self = this;
    WorldGenerator.generateWorld(options.worldID, this.state.blocks).then(nothing =>{
      self.game = new Game(this.state)
      self.setSimulationInterval((deltaTime) => this.update(deltaTime))
    })
  }

  update(delta : number): void {
    this.game.headlessStep(Date.now(), delta)
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
    this.game.onClientJoined(client, options)
  }

  onLeave (client: Client, consented: boolean) {
    this.game.onClientLeave
  }

  onDispose() {
    console.log("Room", this.roomId, "disposing...");
  }
  private game : Game
}
