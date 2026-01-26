import { readHl7File } from "../hl7/readFile";

export async function ingestFile(filePath: string): Promise<void> {
  const raw = await readHl7File(filePath);

  console.log("OK");
  console.log(`read file: ${filePath}`);
  console.log(`chars: ${raw.length}`);
}
