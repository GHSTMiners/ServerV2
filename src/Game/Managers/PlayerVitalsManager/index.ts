import * as Chisel from "chisel-api-interface"
import * as mathjs from "mathjs"
import * as Schema from "../../../rooms/shared/schemas"
import { AavegotchiTraits } from "../../Helpers/AavegotchiInfoFetcher"
import MainScene from "../../Scenes/MainScene"

export default class PlayerVitalsManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, traits : AavegotchiTraits, schema : Schema.Player) {
        super(scene, "PlayerVitalsManager")
        this.traits = traits
        this.schema = schema
        this.vitals = new Map<string, PlayerVital>()
        if(this.scene instanceof MainScene) {
            this.worldInfo = this.scene.worldInfo
        }
        this.createvitals()
    }

    public get(vital : string)  : PlayerVital {
        return this.vitals.get(vital)
    }

    public resetAll() {
        this.vitals.forEach(vital => {
            vital.reset()
        })
    }

    private createvitals () {
        this.worldInfo.vitals.forEach(vital => {
            let newSchema : Schema.Vital = new Schema.Vital()
            newSchema.name = vital.name
            this.schema.vitals.push(newSchema)
            this.vitals.set(vital.name, new PlayerVital(this.scene, vital, newSchema, this.traits))
        }, this)
    }

    private schema : Schema.Player
    private vitals : Map<string, PlayerVital>
    private readonly traits : AavegotchiTraits
    private readonly worldInfo : Chisel.DetailedWorld
}


export class PlayerVital extends Phaser.GameObjects.GameObject{ 
    constructor(scene : Phaser.Scene, vital : Chisel.Vital, schema : Schema.Vital, traits : AavegotchiTraits) {
        super(scene, "PlayerVital")
        this.vital = vital
        this.traits = traits
        this.generateValues()
        this.schema = schema
        this.scene.add.existing(this)

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
        this.m_minimum = mathjs.evaluate(this.vital.minimum, scope)
        this.m_maximum = mathjs.evaluate(this.vital.maximum, scope)
        this.m_initial = mathjs.evaluate(this.vital.initial, scope)
        } catch(exception : any) {
            console.log(exception)
        }
        this.reset()
    }

    protected preUpdate(willStep: boolean, delta: number): void {
        this.syncWithSchema()
    }

    private syncWithSchema() {
        if(this.schema.minimum != this.m_minimum) this.schema.minimum = this.m_minimum
        if(this.schema.maximum != this.m_maximum) this.schema.maximum = this.m_maximum
        if(this.schema.currentValue != this.currentValue()) this.schema.currentValue = this.currentValue()
        if(this.schema.filledValue != this.filledValue()) this.schema.filledValue = this.filledValue()
        if(this.schema.emptyValue != this.emptyValue()) this.schema.emptyValue = this.emptyValue()
    }

    public takeAmount(amount : number) {
        this.m_currentValue = Phaser.Math.Clamp(this.m_currentValue - amount, 0, this.m_maximum)
        this.emit(PlayerVital.VALUE_CHANGED)
        if(this.m_currentValue <= 0) this.emit(PlayerVital.EMPTY)
    }

    public addAmount(amount : number) {
        this.m_currentValue  = Phaser.Math.Clamp(this.m_currentValue + amount, 0, this.m_maximum)
        this.emit(PlayerVital.VALUE_CHANGED)
        if(this.m_currentValue == this.m_minimum) this.emit(PlayerVital.FULL)
    }

    public reset() {
        this.m_currentValue = this.filledValue()
    }

    public filledValue() : number {
        return Phaser.Math.Clamp(this.m_initial, this.m_minimum, this.m_maximum)
    }

    public emptyValue() {
        return this.m_minimum
    }

    public currentValue() : number { 
        return this.m_currentValue
    }

    private schema : Schema.Vital
    private m_minimum : number
    private m_maximum : number
    private m_initial : number
    private m_currentValue : number
    private readonly vital : Chisel.Vital
    private readonly traits : AavegotchiTraits
    static readonly VALUE_CHANGED: unique symbol = Symbol();
    static readonly EMPTY: unique symbol = Symbol();
    static readonly FULL: unique symbol = Symbol();
}

export enum DefaultVitals {
    HEALTH = "Health",
    CARGO = "Cargo",
    FUEL = "Fuel"
}