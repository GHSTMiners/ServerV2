import { Room, Client } from "colyseus";
import WorldGenerator from "../../Generators/WorldGenerator";
import { Crypto } from "../shared/schemas/Crypto";
import { Player } from "../shared/schemas/Player";
import { Block } from "../shared/schemas/World/Block";
import { World } from "../shared/schemas/World/World";
import http from 'http';
import Game from "../../Game";

export class Classic extends Room<World> {

  onCreate (options:any) {
    this.setState(new World());
    this.maxClients = 10;
    this.state.id = options.worldID;

    //Generate blocks for world
    let worldGenerator : WorldGenerator = new WorldGenerator(options.worldID, this.state.blocks)
    this.clientPlayerMap = new Map<string, Player>()
    this.game = new Game()
    this.setSimulationInterval(delta => {
      this.game.headlessStep(Date.now(), delta)
    }, 1000/30);

    var self = this;
    this.onMessage("*", (client: Client, type: string | number, message: string) => {
      let direction : object = JSON.parse(message)
      //@ts-ignore
      self.clientPlayerMap.get(client.id).x += direction.x * 10
      //@ts-ignore
      self.clientPlayerMap.get(client.id).y += direction.y * 10

    })
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
    let newPlayer = new Player();
    this.clientPlayerMap.set(client.id, newPlayer)
    this.state.players.push(newPlayer);
    console.log(`${client.id}, joined!`);
  }

  onLeave (client: Client, consented: boolean) {
    let player : Player = this.clientPlayerMap.get(client.id)
    this.state.players.deleteAt(this.state.players.indexOf(player))
    this.clientPlayerMap.delete(client.id)
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("Room", this.roomId, "disposing...");
  }

  private game : Game
  private clientPlayerMap : Map<string, Player>
}
