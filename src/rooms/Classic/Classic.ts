import { Room, Client } from "colyseus";
import { Crypto } from "../shared/schemas/Crypto";
import { Player } from "../shared/schemas/Player";
import { Block } from "../shared/schemas/World/Block";
import { ClassicSchema } from "./schema/ClassicSchema";

export class Classic extends Room<ClassicSchema> {

  onCreate (options: any) {
    this.setState(new ClassicSchema());
    this.maxClients = 10;
    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });

    //Generate blocks for world
    for (let index = 0; index < 40*1000; index++) {
      let block : Block = new Block();
      block.crypto = new Crypto();

      this.state.world.blocks.push(new Block());
      
    }

  }

  onAuth(client: Client, options: object, request: any) {
    //Verify wallet authentication
    if(options.hasOwnProperty("wallet_address") && options.hasOwnProperty("wallet_auth_token")){

    }

    //Check for name and gotchiID
    if("gotchiID" in options && "name" in options ){
      
    } else return false;
    return true;
  }
  
  

  onJoin (client: Client, options: any) {
    if("gotchiID" in options && "name" in  options) {

    }
    this.state.world.players.push(new Player());
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
