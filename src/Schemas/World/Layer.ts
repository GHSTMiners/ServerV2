import { Schema, ArraySchema, type, filterChildren} from "@colyseus/schema"

export class Layer extends Schema {
    @type (["uint32"]) blocks = new ArraySchema<number>();
}