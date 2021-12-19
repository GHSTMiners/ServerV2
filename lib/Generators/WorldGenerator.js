"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chisel_api_interface_1 = require("chisel-api-interface");
const node_worker_threads_pool_1 = require("node-worker-threads-pool");
const Block_1 = require("../rooms/shared/schemas/World/Block");
class WorldGenerator {
    constructor(worldID, blockSchema) {
        this.worldID = worldID;
        WorldGenerator.generateWorld(this.worldID, blockSchema);
    }
    generateAsync(worldID, blockSchema) {
        const staticPool = new node_worker_threads_pool_1.StaticPool({
            size: 1,
            shareEnv: true,
            task(worldID, blockSchema) {
            }
        });
        staticPool.exec(worldID, blockSchema);
    }
    static generateWorld(worldID, blockSchema) {
        const start = new Date().getTime();
        //Fetch world information
        let apiInterface = new chisel_api_interface_1.APIInterface('https://chisel.gotchiminer.rocks/api');
        //When detailed world information was fetches, start generating world
        apiInterface.world(worldID).then(world => {
            console.log("Generating new world of type: %s, with size %dx%d", world.name, world.width, world.height);
            //Put all spawns in array, maddness
            let sortedSoil = world.soil.sort(WorldGenerator.sortSoil);
            let spawns = [];
            world.crypto.forEach(element => { spawns = spawns.concat(element.spawns); });
            world.rocks.forEach(element => { spawns = spawns.concat(element.spawns); });
            spawns = spawns.concat(world.white_spaces);
            //Fetch all spawns for that layer, and also the soil
            for (let layer = 0; layer < world.height; layer++) {
                let filteredSpawns = spawns.filter(spawn => (layer >= spawn.starting_layer && layer <= spawn.ending_layer));
                let currentSoil = WorldGenerator.soilForLayer(sortedSoil, layer);
                for (let x = 0; x < world.width; x++) {
                    //Fetch current block
                    let currentBlock = new Block_1.Block();
                    //First write soil to blockSchema
                    currentBlock.soilID = currentSoil.id;
                    if (filteredSpawns.length > 0) {
                        //Then set spawn type and spawn id
                        let spawn = WorldGenerator.getRandomSpawn(filteredSpawns);
                        currentBlock.spawnType = spawn.type;
                        switch (spawn.type) {
                            case chisel_api_interface_1.SpawnType.Crypto:
                                currentBlock.spawnID = spawn.crypto_id;
                                break;
                            case chisel_api_interface_1.SpawnType.Rock:
                                currentBlock.spawnID = spawn.rock_id;
                                break;
                            case chisel_api_interface_1.SpawnType.WhiteSpace:
                                currentBlock.spawnType = spawn.background_only ? chisel_api_interface_1.SpawnType.None : chisel_api_interface_1.SpawnType.WhiteSpace;
                                break;
                        }
                    }
                    else
                        currentBlock.spawnType = chisel_api_interface_1.SpawnType.None;
                    blockSchema.push(currentBlock);
                }
            }
            console.log("Finished generating world, took:", new Date().getTime() - start);
        });
    }
    static sortSoil(a, b) {
        if (a.order < b.order) {
            return -1;
        }
        if (a.order > b.order) {
            return 1;
        }
        return 0;
    }
    static soilForLayer(sortedSoil, layer) {
        let currentLayer = 0;
        for (let index = 0; index < sortedSoil.length; index++) {
            const element = sortedSoil[index];
            currentLayer += element.layers;
            if (layer < currentLayer)
                return element;
        }
        return sortedSoil.at(sortedSoil.length - 1); // If nothing is found, return buttom layer
    }
    static getRandomSpawn(elegiableSpawns) {
        //Get sum of all spawnrates
        let spawnRateSum = 0;
        elegiableSpawns.forEach(spawn => spawnRateSum += spawn.spawn_rate);
        //Pick random value between 0 and the sum of spawnrate
        const spawnThreshold = Math.random() * spawnRateSum;
        //Start summing again, and if threshold is reached or surpassed, return current spawn
        spawnRateSum = 0;
        for (let index = 0; index < elegiableSpawns.length; index++) {
            const element = elegiableSpawns[index];
            spawnRateSum += element.spawn_rate;
            if (spawnRateSum >= spawnThreshold)
                return element;
        }
        return elegiableSpawns.at(elegiableSpawns.length - 1);
    }
}
exports.default = WorldGenerator;
