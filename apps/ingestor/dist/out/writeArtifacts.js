"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeJson = writeJson;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
async function writeJson(path, obj) {
    await (0, promises_1.mkdir)((0, node_path_1.dirname)(path), { recursive: true });
    await (0, promises_1.writeFile)(path, JSON.stringify(obj, null, 2), "utf8");
}
