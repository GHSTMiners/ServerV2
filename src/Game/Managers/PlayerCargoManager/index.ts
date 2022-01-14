import { SpawnType } from "chisel-api-interface"
import * as Schema from "../../../Rooms/shared/schemas"
import Player from "../../Objects/Player"
import { DefaultVitals } from "../PlayerVitalsManager"

export default class PlayerCargoManager extends Phaser.GameObjects.GameObject {

    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerCargoManager")
        this.playerSchema = player.playerSchema
        this.player = player
    }

    public processBlock(block : Schema.Block) {
        //Only process block if is a crypto spawn
        if(block.spawnType == SpawnType.Crypto) {
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
        }
        //Take some space from cargo vital
        this.player.vitalsManager().get(DefaultVitals.CARGO).takeAmount(1)
    }

    public empty() {
        this.playerSchema.cargo.clear()
    }
    private player : Player
    private playerSchema : Schema.Player
}