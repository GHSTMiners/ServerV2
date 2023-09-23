import { SpawnType } from "chisel-api-interface";
import { ArraySchema } from "@colyseus/schema"

export class BlockSchemaWrapper {
    constructor(array : ArraySchema<number>, index : number) {
        this.array = array
        this.index = index
    }

    public raw() : number {
        return this.array[this.index]
    }

    public write(block: BlockInterface) {
        // [8-bit spawntype][12-bit soilID][12-bit spawnID]
        const spawnType = block.spawnType << 24
        const soilID    = block.soilID << 12
        const spawnID   = block.spawnID << 0
        this.array[this.index] = spawnType | soilID | spawnID
    }

    public read() : BlockInterface {
        let value : number = this.array[this.index]
        const spawnType = (value & 0b11111111000000000000000000000000) >> 24
        const soilID    = (value & 0b00000000111111111111000000000000) >> 12
        const spawnID   = (value & 0b00000000000000000000111111111111) >> 0
        const block = {} as BlockInterface
        block.soilID = soilID
        block.spawnType = spawnType
        block.spawnID = spawnID
        return block
    }

    private index: number
    private array : ArraySchema<number>
}

export interface BlockInterface {
    soilID : number
    spawnType : SpawnType
    spawnID : number
}