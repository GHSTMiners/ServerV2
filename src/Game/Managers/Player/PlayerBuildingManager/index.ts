import * as Protocol from "gotchiminer-multiplayer-protocol";
import ClientWrapper from "../../../Helpers/ClientWrapper";
import { DefaultVitals } from "../PlayerVitalsManager"
import MainScene from "../../../Scenes/MainScene"
import Player from "../../../Objects/Player";
import { Building } from "chisel-api-interface";
import Config from "../../../../Config";

export default class PlayerBuildingManager extends Phaser.GameObjects.GameObject {
    constructor(scene : Phaser.Scene, player : Player) {
        super(scene, "PlayerMovementManager")
        scene.add.existing(this)
        this.player = player
        this.buildings = new Map<number, Building>()
        player.client().messageRouter.addRoute(Protocol.ActivateBuilding, this.handleActivateBuilding.bind(this))

        //Get a list of buildings
        if(scene instanceof MainScene) {
            scene.worldInfo.buildings.forEach(building => {
                this.buildings.set(building.id, building)
            }, this)
        }
    }

    private handleActivateBuilding(building : Protocol.ActivateBuilding) {
        let targetBuilding : Building | undefined = this.buildings.get(building.id) 
        if(targetBuilding) {
            if(Phaser.Math.Within(this.player.movementManager().blockPosition().y, targetBuilding.spawn_y, Config.layerBuildingRadius)) {
                switch(targetBuilding.type) {
                    case "Fuel":
                        this.player.vitalsManager().get(DefaultVitals.FUEL).reset()
                    break;
                    case "Garage":
                        this.player.vitalsManager().get(DefaultVitals.HEALTH).reset()
                    break
                    case "Refinery":
                        this.player.cargoManager().processCargo()
                    break;
                }
            }
        }
    }

    private buildings : Map<number, Building>
    private player : Player
}