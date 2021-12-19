"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.World = void 0;
const schema_1 = require("@colyseus/schema");
const Player_1 = require("../Player");
const Block_1 = require("./Block");
class World extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.id = 0;
        this.width = 40;
        this.height = 1000;
        this.gravity = 900;
        this.ready = false;
        this.blocks = new schema_1.ArraySchema();
        this.players = new schema_1.ArraySchema();
    }
}
__decorate([
    schema_1.type("number")
], World.prototype, "id", void 0);
__decorate([
    schema_1.type("number")
], World.prototype, "width", void 0);
__decorate([
    schema_1.type("number")
], World.prototype, "height", void 0);
__decorate([
    schema_1.type("number")
], World.prototype, "gravity", void 0);
__decorate([
    schema_1.type("boolean")
], World.prototype, "ready", void 0);
__decorate([
    schema_1.type([Block_1.Block])
], World.prototype, "blocks", void 0);
__decorate([
    schema_1.type([Player_1.Player])
], World.prototype, "players", void 0);
exports.World = World;
