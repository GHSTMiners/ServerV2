import { ArraySchema } from "@colyseus/schema"
import { APIInterface, DetailedWorld, Crypto, CryptoSpawn, RockSpawn, WhiteSpace, Soil, SpawnType } from "chisel-api-interface";
import { StaticPool } from "node-worker-threads-pool"
import * as Schema from "../Rooms/shared/schemas"

export default class WorldGenerator {

    public static async generateWorld(worldID : number, worldSchema : Schema.World) {
        const start = new Date().getTime();
        //Fetch world information
        let apiInterface = new APIInterface('https://chisel.gotchiminer.rocks/api')
        //When detailed world information was fetches, start generating world
        await apiInterface.world(worldID).then(world => {
            //Write fetched world info to world schema
            worldSchema.width = world.width
            worldSchema.height = world.height
            console.log("Generating new world of type: %s, with size %dx%d", world.name, world.width, world.height)
            //Put all spawns in array, maddness
            let sortedSoil : Soil[] = world.soil.sort(WorldGenerator.sortSoil)
            let spawns : (CryptoSpawn|RockSpawn|WhiteSpace) [] = []
            world.crypto.forEach(element=> {spawns = spawns.concat(element.spawns)})
            world.rocks.forEach(element=> {spawns = spawns.concat(element.spawns)})
            spawns = spawns.concat(world.white_spaces);
            //Fetch all spawns for that layer, and also the soil
            for (let layer = 0; layer < world.height; layer++) {
                let filteredSpawns : (CryptoSpawn|RockSpawn|WhiteSpace)[] = spawns.filter(spawn => 
                    (layer >= spawn.starting_layer && layer <= spawn.ending_layer))
                let currentSoil : Soil = WorldGenerator.soilForLayer(sortedSoil, layer)
                for (let x = 0; x < world.width; x++) {
                    //Fetch current block
                    let currentBlock : Schema.Block = new Schema.Block()
                    //First write soil to blockSchema
                    currentBlock.soilID = currentSoil.id;
                    if(filteredSpawns.length > 0 ) {
                        //Then set spawn type and spawn id
                        let spawn : (CryptoSpawn|RockSpawn|WhiteSpace) = WorldGenerator.getRandomSpawn(filteredSpawns)
                        currentBlock.spawnType = spawn.type;
                        switch (spawn.type) {
                            case SpawnType.Crypto:
                                currentBlock.spawnID = (spawn as CryptoSpawn).crypto_id
                                break;
                            case SpawnType.Rock:
                                currentBlock.spawnID = (spawn as RockSpawn).rock_id
                                break;
                            case SpawnType.WhiteSpace:
                                currentBlock.spawnType = (spawn as WhiteSpace).background_only ? SpawnType.None : SpawnType.WhiteSpace
                                break;
                        } 

                    } else currentBlock.spawnType = SpawnType.None
                    worldSchema.blocks.push(currentBlock)
                }
            }
            console.log("Finished generating world, took:", new Date().getTime() - start);
        });
    }

    private static sortSoil(a : Soil, b : Soil) {
        if ( a.order < b.order ){
            return -1;
          }
          if ( a.order > b.order ){
            return 1;
          }
          return 0;
    }

    private static soilForLayer(sortedSoil: Soil[], layer: number) {
        let currentLayer : number = 0;

        for (let index = 0; index < sortedSoil.length; index++) {
            const element = sortedSoil[index];
            currentLayer += element.layers;
            if(layer < currentLayer) return element;
        }
        return sortedSoil.at(sortedSoil.length-1); // If nothing is found, return buttom layer
    }

    private static getRandomSpawn(elegiableSpawns : (CryptoSpawn| RockSpawn| WhiteSpace)[]) : (CryptoSpawn| RockSpawn| WhiteSpace) {
        //Get sum of all spawnrates
        let spawnRateSum : number = 0;
        elegiableSpawns.forEach(spawn => spawnRateSum += spawn.spawn_rate);
        //Pick random value between 0 and the sum of spawnrate
        const spawnThreshold = Math.random() * spawnRateSum;
        //Start summing again, and if threshold is reached or surpassed, return current spawn
        spawnRateSum = 0;
        for (let index = 0; index < elegiableSpawns.length; index++) {
            const element = elegiableSpawns[index];
            spawnRateSum += element.spawn_rate;
            if(spawnRateSum >= spawnThreshold) return element;
        }
        return elegiableSpawns.at(elegiableSpawns.length - 1);
    }

    worldID : number
}