import Player from "../../../Objects/Player";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import * as Chisel from "chisel-api-interface"
import MainScene from "../../../Scenes/MainScene";
import { Upgrade } from "../../../../Schemas/Player/Upgrade";

export  enum UpgradeTier {
    Common = 0,
    Uncommon = Protocol.PurchaseUpgrade.Tier.Uncommon,
    Rare = Protocol.PurchaseUpgrade.Tier.Rare,
    Legendary = Protocol.PurchaseUpgrade.Tier.Legendary,
    Mythical = Protocol.PurchaseUpgrade.Tier.Mythical,
    Godlike = Protocol.PurchaseUpgrade.Tier.Godlike
}

export class PlayerUpgrade extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, upgrade : Chisel.Upgrade, player: Player) {
        super(scene, "PlayerUpgrade")
        this.m_tier = UpgradeTier.Common
        this.m_upgrade = upgrade
        this.m_player = player
        this.createSchema()
    }

    private createSchema() {
        this.m_schema = new Upgrade()
        this.m_schema.tier = this.m_tier
        this.m_schema.id = this.m_upgrade.id
        this.m_player.playerSchema.upgrades.set(this.m_upgrade.id.toString(), this.m_schema)
    }

    public increaseTier() {
        if(this.tier() < UpgradeTier.Godlike) {
            this.m_tier++
            this.m_schema.tier = this.m_tier
            this.emit(PlayerUpgrade.TIER_CHANGED)
        }
    }

    public tier() : UpgradeTier {
        return this.m_tier
    }

    public upgrade() : Chisel.Upgrade {
        return this.m_upgrade
    }

    public formula_for_skill(skillId : number) : string | undefined {
        let skill_effect : Chisel.UpgradeSkillEffect | undefined = this.upgrade().skill_effects.find(effect => effect.skill_id == skillId)
        if(skill_effect) return skill_effect.formula
        else return null
    }

    public formula_for_vital(vitalId : number) : string | undefined {
        let vital_effect : Chisel.UpgradeVitalEffect | undefined = this.upgrade().vital_effects.find(effect => effect.vital_id == vitalId)
        if(vital_effect) return vital_effect.formula
        else return null
    }

    private m_tier : UpgradeTier
    private m_player: Player
    private m_schema : Upgrade
    private m_upgrade : Chisel.Upgrade
    static readonly TIER_CHANGED: unique symbol = Symbol();

}

export class PlayerUpgradeManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerUpgradeManager")
        if(scene instanceof MainScene) {
            this.m_mainScene = scene
        }
        this.m_player = player
        this.m_upgrades = new Map<number, PlayerUpgrade>()
        //Load all upgrades
        this.m_mainScene.worldInfo.upgrades.forEach(upgrade => {
            this.m_upgrades.set(upgrade.id, new PlayerUpgrade(scene, upgrade, player))
        }, this)
    }

    public stringToTierNr(name : string) : number {
        switch(name) {
            case "Common":
                return 0;
            case "Uncommon":
                return 1;
            case "Rare":
                return 2;
            case "Legendary":
                return 3;
            case "Mythical":
                return 4;
            case "Godlike":
                return 5;
            default:
                return -1;
        }
    }

    public upgrade(id : number) : PlayerUpgrade | undefined {
        return this.m_upgrades.get(id)
    }

    public upgrades_for_skill(skillId : number) : PlayerUpgrade[] {
        let upgrades : PlayerUpgrade[] = []
        this.m_upgrades.forEach(upgrade => {
            let effect : Chisel.UpgradeSkillEffect | undefined = upgrade.upgrade().skill_effects.find(effect => effect.skill_id == skillId)
            if(effect !== undefined) upgrades.push(upgrade) 
        })
        return upgrades
    }

    public upgrades_for_vital(vitalId : number) : PlayerUpgrade[] {
        let upgrades : PlayerUpgrade[] = []
        this.m_upgrades.forEach(upgrade => {
            let effect : Chisel.UpgradeVitalEffect | undefined = upgrade.upgrade().vital_effects.find(effect => effect.vital_id == vitalId)
            if(effect !== undefined) upgrades.push(upgrade)
        })
        return upgrades
    }
 

    private m_mainScene : MainScene
    private m_upgrades : Map<number, PlayerUpgrade>
    
    private m_player : Player
}