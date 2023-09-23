import * as Chisel from "chisel-api-interface"
import Player from "../Player"

export class Consumable extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player, chiselConsumable : Chisel.Consumable) {
        super(scene, "Consumable")
        this.active = false
        this.player = player
        this.chiselConsumable = chiselConsumable
    }

    private handleConsumableExpired() {
        this.active = false
        this.emit(Consumable.EXPIRED)
    }

    public formula_for_skill(skillId : number) : string | undefined {
        let skill_effect : Chisel.SkillEffect | undefined = this.chiselConsumable.skill_effects.find(effect => effect.skill_id == skillId)
        if(skill_effect) return skill_effect.formula
        else return null
    }

    public formula_for_vital(vitalId : number) : string | undefined {
        let vital_effect : Chisel.VitalEffect | undefined = this.chiselConsumable.vital_effects.find(effect => effect.vital_id == vitalId)
        if(vital_effect) return vital_effect.formula
        else return null
    }

    public activate() {
        // Evaluate expression
        var player = this.player
        eval(this.chiselConsumable.script)

        this.active = true
        this.scene.time.delayedCall(this.chiselConsumable.duration * 1000, this.handleConsumableExpired, null, this);
        this.emit(Consumable.ACTIVATED)
    }

    static readonly EXPIRED: unique symbol = Symbol();
    static readonly ACTIVATED: unique symbol = Symbol();
    public chiselConsumable : Chisel.Consumable
    public active : boolean
    public player : Player
}