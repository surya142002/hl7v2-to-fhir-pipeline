import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeJson(path: string, obj: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(obj, null, 2), "utf8");
}
