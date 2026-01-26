import { readHl7File } from "../hl7/readFile";
import { parseHl7 } from "../hl7/parse";

export async function ingestFile(filePath: string): Promise<void> {
  const raw = await readHl7File(filePath);
  const msg = parseHl7(raw);

  const segNames = msg.segments.map((s) => s.name).join(",");

  console.log("OK");
  console.log(`read file: ${filePath}`);
  console.log(`chars: ${raw.length}`);
  console.log(`fieldSep: ${msg.fieldSep}`);
  console.log(`segments: ${segNames}`);
}
