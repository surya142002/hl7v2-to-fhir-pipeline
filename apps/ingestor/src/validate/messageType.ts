import { ParsedMessage } from "../model/types";
import { ValidationException } from "./errors";

function normalizeType(messageType?: string): string {
  return (messageType ?? "").trim();
}

export function requireSupportedMessageType(x: ParsedMessage): void {
  const t = normalizeType(x.msh.messageType);

  if (!t) {
    throw new ValidationException([
      { code: "HL7_MSH_9_REQUIRED", message: "Missing MSH-9 message type", segment: "MSH", field: "9" },
    ]);
  }

  const [msgCode, trigger] = t.split("^").map((s) => s.trim());
  const ok =
    (msgCode === "ADT" && trigger === "A01") ||
    (msgCode === "ORU" && trigger === "R01");

  if (!ok) {
    throw new ValidationException([
      {
        code: "HL7_UNSUPPORTED_MESSAGE",
        message: `Unsupported message type: ${t}. Only ADT^A01 and ORU^R01 are allowed in Phase 1.`,
        segment: "MSH",
        field: "9",
      },
    ]);
  }
}
