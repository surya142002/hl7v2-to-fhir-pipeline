import { HL7Message, HL7Segment } from "./types";

function splitLines(raw: string): string[] {
  // HL7 commonly uses \r as segment delimiter; normalize \n to \r then split.
  const normalized = raw.replace(/\n/g, "\r");
  return normalized
    .split("\r")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function detectFieldSep(lines: string[]): string {
  const msh = lines.find((l) => l.startsWith("MSH"));
  if (!msh) throw new Error("HL7 parse error: missing MSH segment");
  if (msh.length < 4) throw new Error("HL7 parse error: invalid MSH segment");
  return msh[3]; // MSH|... => '|' is at index 3
}

function parseSegment(line: string, fieldSep: string): HL7Segment {
  const parts = line.split(fieldSep);
  const name = parts[0];

  // Store as 1-based fields for HL7 semantics
  const fields: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    fields[i] = parts[i] ?? "";
  }

  return {
    name,
    raw: line,
    fields
  };
}

export function parseHl7(raw: string): HL7Message {
  const lines = splitLines(raw);
  if (lines.length === 0) throw new Error("HL7 parse error: empty message");

  const fieldSep = detectFieldSep(lines);
  const segments = lines.map((l) => parseSegment(l, fieldSep));

  return {
    raw,
    fieldSep,
    segments
  };
}
