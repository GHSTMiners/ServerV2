import { Schema, Context, type } from "@colyseus/schema";
import { World } from "../../shared/schemas/World/World";

export class ClassicSchema extends Schema {
  @type(World) world: World = new World();
  @type("string") mySynchronizedProperty: string = "Hello world";

}
