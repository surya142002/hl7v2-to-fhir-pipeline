"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHl7 = parseHl7;
function splitLines(raw) {
    const normalized = raw.replace(/\n/g, "\r");
    return normalized
        .split("\r")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
function detectFieldSep(lines) {
    const msh = lines.find((l) => l.startsWith("MSH"));
    if (!msh)
        throw new Error("HL7 parse error: missing MSH segment");
    if (msh.length < 4)
        throw new Error("HL7 parse error: invalid MSH segment");
    return msh[3];
}
function parseSegment(line, fieldSep) {
    const parts = line.split(fieldSep);
    const name = parts[0];
    const fields = [];
    if (name === "MSH") {
        // HL7 special case:
        // MSH-1 is the field separator itself, and does NOT appear in parts[] after split.
        // parts[1] is MSH-2 (encoding chars).
        fields[1] = fieldSep; // MSH-1
        for (let i = 1; i < parts.length; i++) {
            fields[i + 1] = parts[i] ?? ""; // shift by +1 so parts[1] becomes fields[2]
        }
    }
    else {
        // normal segments
        for (let i = 1; i < parts.length; i++) {
            fields[i] = parts[i] ?? "";
        }
    }
    return { name, raw: line, fields };
}
function parseHl7(raw) {
    const lines = splitLines(raw);
    if (lines.length === 0)
        throw new Error("HL7 parse error: empty message");
    const fieldSep = detectFieldSep(lines);
    const segments = lines.map((l) => parseSegment(l, fieldSep));
    return { raw, fieldSep, segments };
}
