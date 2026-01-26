"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readHl7File = readHl7File;
const promises_1 = require("node:fs/promises");
async function readHl7File(filePath) {
    let raw;
    try {
        const buf = await (0, promises_1.readFile)(filePath);
        raw = buf.toString("utf8");
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`HL7 read error: cannot read file "${filePath}": ${msg}`);
    }
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
        throw new Error(`HL7 read error: file is empty: "${filePath}"`);
    }
    return trimmed;
}
