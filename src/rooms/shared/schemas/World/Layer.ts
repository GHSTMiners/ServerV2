import { Schema, ArraySchema, type, filterChildren} from "@colyseus/schema"
import { Block } from "./Block";


export class Layer extends Schema {
    @type ([Block]) blocks = new ArraySchema<Block>();
}