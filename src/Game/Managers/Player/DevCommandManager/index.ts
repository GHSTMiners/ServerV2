import Player from "../../../Objects/Player"
import MainScene from "../../../Scenes/MainScene"
import * as Chisel from "chisel-api-interface"
import * as Protocol from 'gotchiminer-multiplayer-protocol'
import { ExplosiveEntry } from "../../../../Schemas/Player/ExplosiveEntry";
import { WalletEntry } from "../../../../Schemas/Player/WalletEntry";
import { DefaultVitals } from "../../Player/PlayerVitalsManager";

export default class DevCommandManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, player : Player) {
        super(scene, "DevCommandManager")
        this.player = player
        this.mainScene = scene
        this.commandMap = new Map<string, () => void>()
        var self = this;
        player.client().messageRouter.addRoute(Protocol.MessageToServer, message => {
            self.processMessage(message.msg);
        })
        this.commandMap.set("help", this.printHelp.bind(this))
        this.commandMap.set("endgame", this.endGame.bind(this))
        this.commandMap.set("killme", this.killMe.bind(this))
        this.commandMap.set("refuel", this.refuel.bind(this))
        this.commandMap.set("movetosurface", this.moveToSurface.bind(this))
        this.commandMap.set("giveexplosives", this.giveExplosives.bind(this))
        this.commandMap.set("givemoney", this.giveMoney.bind(this))
        this.commandMap.set("giveallupgrades", this.giveAllUpgrades.bind(this))
        this.commandMap.set("refuel", this.giveMoney.bind(this))
    }

    private processMessage(message : string) {
        if(message.startsWith('/')) {
            const command = this.commandMap.get(message.substring(1))
            if(command) {
                command(this.player)
            }
        }
    }

    private printHelp(player : Player) {
        this.commandMap.forEach((value, key) => {
            this.mainScene.chatManager.broadCastMessage(`/${key}`)
        }) 
    }

    private endGame(player : Player) {
        this.mainScene.playTimeManager.terminate()
    }

    private killMe(player : Player) {
        player.respawnManager().respawn()
    }

    private moveToSurface(player : Player) {
        player.movementManager().moveToSurface()
    }

    private giveExplosives(player : Player) {
        this.mainScene.worldInfo.explosives.forEach(explosive => {
            //Add explosive to inventory
            let explosiveEntry : ExplosiveEntry | undefined = player.playerSchema.explosives.get(explosive.id.toString())
            if(explosiveEntry) {
                explosiveEntry.amount = 10000
            } else {
                explosiveEntry = new ExplosiveEntry()
                explosiveEntry.amount = 10000
                explosiveEntry.explosiveID = explosive.id
                player.playerSchema.explosives.set(explosive.id.toString(), explosiveEntry)
            }
        })
    }

    private giveMoney(player : Player) {
        this.mainScene.worldInfo.crypto.forEach(crypto => {
            //Add explosive to inventory
            let walletEntry : WalletEntry | undefined = player.playerSchema.wallet.get(crypto.id.toString())
            if(walletEntry) {
                walletEntry.amount = 100000
            } else {
                walletEntry = new WalletEntry()
                walletEntry.amount = 100000
                walletEntry.cryptoID = crypto.id
                player.playerSchema.wallet.set(crypto.id.toString(), walletEntry)
            }
        })
    }

    private giveAllUpgrades(player : Player) {
        player.upgradeManager().upgrades().forEach(upgrade => {
            upgrade.maxOut()
        })
    }

    private refuel(player : Player) {
        player.vitalsManager().get(DefaultVitals.FUEL).reset()
    }

    private commandMap : Map<string, (player : Player) => void> 
    private mainScene : MainScene
    private player : Player
}