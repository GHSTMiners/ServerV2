import { SpawnType } from "chisel-api-interface"
import * as Schema from "../../../../Schemas"
import { BlockInterface } from "../../../../Helpers/BlockSchemaWrapper"
import Player from "../../../Objects/Player"
import { DefaultVitals } from "../PlayerVitalsManager"

export default class PlayerCargoManager extends Phaser.GameObjects.GameObject {

    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerCargoManager")
        this.playerSchema = player.playerSchema
        this.player = player
    }

    public processBlock(block : BlockInterface) : boolean {
        //Only process block if is a crypto spawn
        if(block.spawnType == SpawnType.Crypto) {
            //Only process block if there is space left
            if(!this.player.vitalsManager().get(DefaultVitals.CARGO).isDepleted()) {
                //Fetch block from cargo, if does not exist it will return as null
                let targetCargoSpace : Schema.CargoEntry | undefined = this.playerSchema.cargo.get(block.spawnID.toString())
                //Check if target cargo space is defined
                if(targetCargoSpace) {
                    targetCargoSpace.amount+=1
                } else {
                    targetCargoSpace = new Schema.CargoEntry()
                    targetCargoSpace.cryptoID = block.spawnID
                    this.playerSchema.cargo.set(block.spawnID.toString(), targetCargoSpace)
                }
                //Take some space from cargo vital
                this.player.vitalsManager().get(DefaultVitals.CARGO).takeAmount(1)
                return true
            } else return false
        }
    }

    public processCargo() {
        //Move cargo to wallet
        this.playerSchema.cargo.forEach(cargoEntry => {
            this.player.walletManager().addAmount(cargoEntry.cryptoID, cargoEntry.amount)
        })
        this.empty()
    }

    public empty() {
        this.playerSchema.cargo.forEach((elt,key) => {this.playerSchema.cargo.delete(key)});
        this.player.vitalsManager().get(DefaultVitals.CARGO).reset()
    }
    private player : Player
    private playerSchema : Schema.Player
}