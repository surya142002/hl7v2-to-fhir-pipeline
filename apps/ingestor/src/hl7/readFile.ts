import { readFile } from "node:fs/promises";

export async function readHl7File(filePath: string): Promise<string> {
  let raw: string;

  try {
    const buf = await readFile(filePath);
    raw = buf.toString("utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`HL7 read error: cannot read file "${filePath}": ${msg}`);
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error(`HL7 read error: file is empty: "${filePath}"`);
  }

  return trimmed;
}
