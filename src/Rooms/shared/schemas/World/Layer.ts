import { Schema, ArraySchema, type, filterChildren} from "@colyseus/schema"

export class Layer extends Schema {
    @type (["string"]) blocks = new ArraySchema<string>();
}