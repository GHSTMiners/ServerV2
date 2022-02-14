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

    public processBlock(block : Schema.Block) : boolean {
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
            let walletEntry : Schema.WalletEntry | undefined = this.playerSchema.wallet.get(cargoEntry.cryptoID.toString())
            if(walletEntry) {
                walletEntry.amount += cargoEntry.amount
            } else {
                walletEntry = new Schema.WalletEntry()
                walletEntry.cryptoID = cargoEntry.cryptoID
                walletEntry.amount = cargoEntry.amount
                this.playerSchema.wallet.set(walletEntry.cryptoID.toString(), walletEntry)
            }
        })
        this.empty()
    }

    public empty() {
        this.playerSchema.cargo.clear()
        this.player.vitalsManager().get(DefaultVitals.CARGO).reset()
    }
    private player : Player
    private playerSchema : Schema.Player
}