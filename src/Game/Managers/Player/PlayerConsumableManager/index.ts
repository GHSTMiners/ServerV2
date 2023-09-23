import * as Chisel from "chisel-api-interface"
import { Skill } from "../../../../Schemas"
import { AavegotchiTraits } from "../../../../Helpers/AavegotchiInfoFetcher"
import MainScene from "../../../Scenes/MainScene"
import { PlayerUpgradeManager, PlayerUpgrade } from "../PlayerUpgradeManager"
import Player from "../../../Objects/Player";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import { ConsumableEntry } from "../../../../Schemas/Player/ConsumableEntry";
import { List } from "lodash"
import { Consumable } from "../../../Objects/Consumable"

export default class PlayerConsumableManager extends Phaser.GameObjects.GameObject {
    constructor(scene : MainScene, player : Player) {
        super(scene, "PlayerConsumableManager")
        this.mainScene = scene
        this.player = player
        this.player.client().messageRouter.addRoute(Protocol.RequestUseConsumable, this.handleUseConsumable.bind(this))
        
        //Create maps
        this.consumableMap = new Map<number, Consumable>()
        this.mainScene.worldInfo.consumables.forEach(consumable => {
            this.consumableMap.set(consumable.id, new Consumable(this.scene, player, consumable)) 
        })
    }

    public consumables_for_skill(skillId : number) : Consumable[] {
        let consumables : Consumable[] = []
        this.consumableMap.forEach(consumable => {
            let effect : Consumable | Chisel.SkillEffect = consumable.chiselConsumable.skill_effects.find(effect => effect.skill_id == skillId)
            if(effect !== undefined) consumables.push(consumable) 
        })
        return consumables
    }

    public consumables_for_vital(vitalId : number) : Consumable[] {
        let consumables : Consumable[] = []
        this.consumableMap.forEach(consumable => {
            let effect : Consumable | Chisel.VitalEffect = consumable.chiselConsumable.vital_effects.find(effect => effect.vital_id == vitalId)
            if(effect !== undefined) consumables.push(consumable) 
        })
        return consumables
    }

    private handleUseConsumable(message : Protocol.RequestUseConsumable) {
        //First we need to check whether the player has that kind of consumable in its inventory
        let consumableEntry : ConsumableEntry = this.player.playerSchema.consumables.get(message.consumableID.toString())
        if (consumableEntry && this.consumableMap.has(message.consumableID)) {
            let consumable : Consumable = this.consumableMap.get(message.consumableID)
            if(consumableEntry.amount > 0 && consumableEntry.nextTimeAvailable < Date.now()) {
                // Take some from the inventory, and set next time available
                consumableEntry.amount -= 1
                consumableEntry.amountSpawned += 1
                consumableEntry.nextTimeAvailable = Date.now() + (consumable.chiselConsumable.duration * 1000)
                // create new consumable
                consumable.activate()
            }
        }
    }

    private consumableMap : Map<number, Consumable>
    private mainScene : MainScene
    private player : Player
}


