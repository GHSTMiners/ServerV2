import * as Protocol from "gotchiminer-multiplayer-protocol";
import ClientWrapper from "../../../../Helpers/ClientWrapper";
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

    public nearestSpawnPortal() : Phaser.Geom.Point {
        //Find the closest portal above the player
        let nearestBuildingDistance : number = Number.MAX_SAFE_INTEGER
        let selectedBuilding : Building | undefined;
        this.buildings.forEach(building => {
            if(building.type == "Portal") {
                let playerPosition : Phaser.Geom.Point = this.player.movementManager().blockPosition()
                let buildingPosition : Phaser.Geom.Point = new Phaser.Geom.Point(building.spawn_x, building.spawn_y)
                if(buildingPosition.y < playerPosition.y) {
                    let currentBuildingDistance : number = Phaser.Math.Distance.BetweenPoints(buildingPosition, playerPosition)
                    if(currentBuildingDistance < nearestBuildingDistance) {
                        nearestBuildingDistance = currentBuildingDistance
                        selectedBuilding = building
                    }
                }
            }
        })
        if(selectedBuilding) return new Phaser.Geom.Point(selectedBuilding.spawn_x, selectedBuilding.spawn_y)
        // If no portal was found above the player, just find the nearest portal
        nearestBuildingDistance = Number.MAX_SAFE_INTEGER
        this.buildings.forEach(building => {
            if(building.type == "Portal") {
            let playerPosition : Phaser.Geom.Point = this.player.movementManager().blockPosition()
            let buildingPosition : Phaser.Geom.Point = new Phaser.Geom.Point(building.spawn_x, building.spawn_y)
                let currentBuildingDistance : number = Phaser.Math.Distance.BetweenPoints(buildingPosition, playerPosition)
                if(currentBuildingDistance < nearestBuildingDistance) {
                    nearestBuildingDistance = currentBuildingDistance
                    selectedBuilding = building
                }
            }
        })
        if(selectedBuilding) return new Phaser.Geom.Point(selectedBuilding.spawn_x, selectedBuilding.spawn_y)
        // If no portal was found, just return (0, 0)
        return new Phaser.Geom.Point(0, 0)
    }

    private buildings : Map<number, Building>
    private player : Player
}