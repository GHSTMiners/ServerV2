import * as Chisel from "chisel-api-interface"
import * as mathjs from "mathjs"
import { AavegotchiTraits } from "../../Helpers/AavegotchiInfoFetcher"
import MainScene from "../../Scenes/MainScene"

export default class PlayerSkillManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, traits : AavegotchiTraits) {
        super(scene, "PlayerSkillManager")
        this.traits = traits
        this.skills = new Map<string, PlayerSkill>()
        if(this.scene instanceof MainScene) {
            this.worldInfo = this.scene.worldInfo
        }
        this.createSkills()
        
    }

    public get(skill : string)  : PlayerSkill{
        return this.skills.get(skill)
    }

    private createSkills () {
        this.worldInfo.skills.forEach(skill => {
            this.skills.set(skill.name, new PlayerSkill(skill, this.traits))
        }, this)
    }

    private skills : Map<string, PlayerSkill>
    private readonly traits : AavegotchiTraits
    private readonly worldInfo : Chisel.DetailedWorld
}

export class PlayerSkill {
    constructor(skill : Chisel.Skill, traits : AavegotchiTraits) {
        this.skill = skill
        this.traits = traits
        this.generateValues()
    }

    private generateValues() {
        //Create scope
        let scope = {
            energy: this.traits.energy,
            aggressiveness: this.traits.aggression,
            spookiness: this.traits.spookiness,
            brain_size: this.traits.brain_size,
            eye_shape: this.traits.eye_shape,
            eye_color: this.traits.eye_color
        }
        try {
        this.minimum = mathjs.evaluate(this.skill.minimum, scope)
        this.maximum = mathjs.evaluate(this.skill.maximum, scope)
        this.initial = mathjs.evaluate(this.skill.initial, scope)
        } catch(exception : any) {
            console.log(exception)
        }
    }

    public value() : number {
        return Phaser.Math.Clamp(this.initial, this.minimum, this.maximum)
    }

    private minimum : number
    private maximum : number
    private initial : number
    private skill : Chisel.Skill
    private readonly traits : AavegotchiTraits
}

export enum DefaultSkills {
    DIGGING_SPEED = "Digging speed",
    FLYING_SPEED = "Flying speed",
    FLYING_SPEED_ACCELLERATION = "Flying speed acceleration",
    MOVING_SPEED_ACCELLERATION = "Moving speed acceleration",
    MOVING_SPEED = "Moving speed",
    STATIONARY_FUEL_USAGE = "Stationary fuel usage",
    DIGGING_FUEL_USAGE = "Digging fuel usage",
    FLYING_FUEL_USAGE = "Flying fuel usage",
    MOVING_FUEL_USAGE = "Moving fuel usage",
    MAX_SPEED_BEFORE_DAMAGE = "Max speed before damage",
    CONSUMABLE_PRICE = "Consumable price",
    REFINERY_YIELD = "Refinery yield"
}