import { SpawnType } from "chisel-api-interface";

export class BlockSchemaWrapper {
    static blockToString(block: BlockInterface) : string {
        return `${block.soilID},${block.spawnType},${block.spawnID}`
    }

    static stringToBlock(string : String) : BlockInterface {
        var values = string.split(',');
        const block = {} as BlockInterface
        block.soilID = parseInt(values[0])
        block.spawnType = parseInt(values[1])
        block.spawnID = parseInt(values[2])
        return block
    }
}

export interface BlockInterface {
    soilID : number
    spawnType : SpawnType
    spawnID : number
}