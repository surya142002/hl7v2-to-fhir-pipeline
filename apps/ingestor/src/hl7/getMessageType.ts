import { ParsedMessage } from "../model/types";

export function getNormalizedMessageType(x: ParsedMessage): { code: string; trigger: string; raw: string } | null {
  const raw = (x.msh.messageType ?? "").trim();
  if (!raw) return null;
  const [code, trigger] = raw.split("^").map((s) => s.trim());
  if (!code || !trigger) return null;
  return { code, trigger, raw };
}
