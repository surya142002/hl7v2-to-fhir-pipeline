import { HL7Message, HL7Segment } from "../hl7/types";
import { ParsedMessage } from "./types";

function findSegment(msg: HL7Message, name: string): HL7Segment | undefined {
  return msg.segments.find((s) => s.name === name);
}

function getField(seg: HL7Segment | undefined, n: number): string | undefined {
  if (!seg) return undefined;
  const v = (seg.fields[n] ?? "").trim();
  return v.length ? v : undefined;
}

function firstRepetition(field: string | undefined): string | undefined {
  if (!field) return undefined;
  const v = (field.split("~")[0] ?? "").trim();
  return v.length ? v : undefined;
}

function component(field: string | undefined, idx1: number): string | undefined {
  if (!field) return undefined;
  const parts = field.split("^");
  const v = (parts[idx1 - 1] ?? "").trim();
  return v.length ? v : undefined;
}

export function normalizeMessage(msg: HL7Message): ParsedMessage {
  const msh = findSegment(msg, "MSH");
  const pid = findSegment(msg, "PID");
  const pv1 = findSegment(msg, "PV1");

  const segmentNames = msg.segments.map((s) => s.name);
  const rawSegments = msg.segments.map((s) => ({ name: s.name, raw: s.raw }));

  const supported = new Set(["MSH", "PID", "PV1", "OBR", "OBX"]);
  const unknownSegments = Array.from(new Set(segmentNames.filter((n) => !supported.has(n)))).sort();

  const obrs = msg.segments.filter((s) => s.name === "OBR").map((s) => ({ raw: s.raw }));
  const obxs = msg.segments.filter((s) => s.name === "OBX").map((s) => ({ raw: s.raw }));

  return {
    msh: {
      messageType: getField(msh, 9),
      controlId: getField(msh, 10),
      sendingApp: getField(msh, 3),
      sendingFacility: getField(msh, 4),
      timestamp: getField(msh, 7),
    },
    pid: pid
      ? {
          mrn: component(firstRepetition(getField(pid, 3)), 1),
          familyName: component(getField(pid, 5), 1),
          givenName: component(getField(pid, 5), 2),
          birthDateRaw: getField(pid, 7),
          sexRaw: getField(pid, 8),
        }
      : undefined,
    pv1: pv1
      ? {
          visitNumber: component(firstRepetition(getField(pv1, 19)), 1),
          admitDateTimeRaw: getField(pv1, 44),
        }
      : undefined,
    obrs,
    obxs,
    segmentNames,
    rawSegments,
    unknownSegments,
  };
}