import * as Schema from "../../../../Schemas";
import Player from "../../../Objects/Player";

export default class PlayerWalletManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerWalletManager")
        this.player = player
    }   
    
    public hasAmount(cryptoID : number, amount : number) : boolean {
        let walletEntry : Schema.WalletEntry | undefined = this.player.playerSchema.wallet.get(cryptoID.toString())
        if(walletEntry) {
            return walletEntry.amount >= amount
        } else return false
    }

    public addAmount(cryptoID : number, amount : number) {
        let walletEntry : Schema.WalletEntry | undefined = this.player.playerSchema.wallet.get(cryptoID.toString())
        if(walletEntry) {
            walletEntry.amount += amount
        } else {
            walletEntry = new Schema.WalletEntry()
            walletEntry.cryptoID = cryptoID
            walletEntry.amount = amount
            this.player.playerSchema.wallet.set(walletEntry.cryptoID.toString(), walletEntry)
        }
        this.emit(PlayerWalletManager.ADDED_CRYPTO, cryptoID, amount)

    }

    public takeAmount(cryptoID : number, amount : number) : boolean {
        if(this.hasAmount(cryptoID, amount)) {
            let walletEntry : Schema.WalletEntry | undefined = this.player.playerSchema.wallet.get(cryptoID.toString())
            if(walletEntry) {
                walletEntry.amount -= amount
                this.emit(PlayerWalletManager.TAKEN_CRYPTO, cryptoID, amount)
                return true
            } else return false
        } else return false
    }
    static readonly ADDED_CRYPTO: unique symbol = Symbol();
    static readonly TAKEN_CRYPTO: unique symbol = Symbol();
    private player : Player
}