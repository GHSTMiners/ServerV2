"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const schema_1 = require("@colyseus/schema");
const Crypto_1 = require("../Crypto");
const Rock_1 = require("./Rock");
class Block extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.crypto = new Crypto_1.Crypto();
        this.rock = new Rock_1.Rock();
    }
}
__decorate([
    schema_1.type(Crypto_1.Crypto)
], Block.prototype, "crypto", void 0);
__decorate([
    schema_1.type(Rock_1.Rock)
], Block.prototype, "rock", void 0);
exports.Block = Block;
