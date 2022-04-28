import Player from "../../../Objects/Player";
import * as Protocol from "gotchiminer-multiplayer-protocol"
import * as Chisel from "chisel-api-interface"
import MainScene from "../../../Scenes/MainScene";

export  enum UpgradeTier {
    Common = 0,
    Uncommon = Protocol.PurchaseUpgrade.Tier.Uncommon,
    Rare = Protocol.PurchaseUpgrade.Tier.Rare,
    Legendary = Protocol.PurchaseUpgrade.Tier.Legendary,
    Mythical = Protocol.PurchaseUpgrade.Tier.Mythical,
    Godlike = Protocol.PurchaseUpgrade.Tier.Godlike
}

export class PlayerUpgrade extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, upgrade : Chisel.Upgrade) {
        super(scene, "PlayerUpgrade")
        this.m_tier = UpgradeTier.Common
        this.m_upgrade = upgrade
    }

    public increaseTier() {
        if(this.tier() < UpgradeTier.Godlike) {
            this.m_tier++
            this.emit(PlayerUpgrade.TIER_CHANGED)
        }
    }

    public tier() : UpgradeTier {
        return this.m_tier
    }

    public upgrade() : Chisel.Upgrade {
        return this.m_upgrade
    }

    private m_tier : UpgradeTier
    private m_upgrade : Chisel.Upgrade
    static readonly TIER_CHANGED: unique symbol = Symbol();

}

export default class PlayerUpgradeManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerUpgradeManager")
        if(scene instanceof MainScene) {
            this.m_mainScene = scene
        }
        this.m_player = player
        this.m_upgrades = new Map<number, PlayerUpgrade>()
        //Load all upgrades
        this.m_mainScene.worldInfo.upgrades.forEach(upgrade => {
            this.m_upgrades.set(upgrade.id, new PlayerUpgrade(scene, upgrade))
        }, this)
    }

    public upgrade(id : number) : PlayerUpgrade | undefined {
        return this.m_upgrades.get(id)
    }

    public upgrades_for_skill(skillId : number) : PlayerUpgrade[] {
        let upgrades : PlayerUpgrade[] = []
        this.m_upgrades.forEach(upgrade => {
            let effect : Chisel.UpgradeSkillEffect | undefined = upgrade.upgrade().skill_effects.find(effect => effect.skill_id = skillId)
            if(effect) upgrades.push(upgrade)
        })
        return upgrades
    }

    public upgrades_for_vital(vitalId : number) : PlayerUpgrade[] {
        let upgrades : PlayerUpgrade[] = []
        this.m_upgrades.forEach(upgrade => {
            let effect : Chisel.UpgradeVitalEffect | undefined = upgrade.upgrade().vital_effects.find(effect => effect.vital_id = vitalId)
            if(effect) upgrades.push(upgrade)
        })
        return upgrades
    }
 

    private m_mainScene : MainScene
    private m_upgrades : Map<number, PlayerUpgrade>
    
    private m_player : Player
}