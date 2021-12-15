import { Room, Client } from "colyseus";
import WorldGenerator from "../../Generators/WorldGenerator";
import { Crypto } from "../shared/schemas/Crypto";
import { Player } from "../shared/schemas/Player";
import { Block } from "../shared/schemas/World/Block";
import { World } from "../shared/schemas/World/World";
import http from 'http';

export class Classic extends Room<World> {

  onCreate (options:any) {
    this.setState(new World());
    this.maxClients = 10;
    this.state.id = options.worldID;
    // console.log(`New room with name ${this.roomName} was created`);
    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });

    //Generate blocks for world
    let worldGenerator : WorldGenerator = new WorldGenerator(options.worldID, this.state.blocks)
  }


  update() {
    
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
    if("gotchiID" in options && "name" in  options) {

    }
    this.state.players.push(new Player());
    console.log(`${client.sessionId}, joined!`);
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("Room", this.roomId, "disposing...");
  }

}
