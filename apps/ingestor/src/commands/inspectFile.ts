import { readHl7File } from "../hl7/readFile";
import { parseHl7 } from "../hl7/parse";
import { HL7Message, HL7Segment } from "../hl7/types";

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

export async function inspectFile(filePath: string): Promise<void> {
  const raw = await readHl7File(filePath);
  const msg = parseHl7(raw);

  const msh = findSegment(msg, "MSH");
  const pid = findSegment(msg, "PID");
  const pv1 = findSegment(msg, "PV1");

  // MSH basics
  const messageType = getField(msh, 9);
  const controlId = getField(msh, 10);
  const sendingApp = getField(msh, 3);
  const sendingFacility = getField(msh, 4);
  const timestamp = getField(msh, 7);

  // Optional patient/visit surface
  const mrn = component(firstRepetition(getField(pid, 3)), 1);
  const visitNumber = component(firstRepetition(getField(pv1, 19)), 1);

  // Counts (for future ORU fixtures too)
  const obrCount = msg.segments.filter((s) => s.name === "OBR").length;
  const obxCount = msg.segments.filter((s) => s.name === "OBX").length;

  const segmentNames = msg.segments.map((s) => s.name);
  const supported = new Set(["MSH", "PID", "PV1", "OBR", "OBX"]);
  const unknownSegments = Array.from(new Set(segmentNames.filter((n) => !supported.has(n)))).sort();

  console.log("OK");
  console.log(`file: ${filePath}`);
  console.log(`messageType: ${messageType ?? "MISSING"}`);
  console.log(`controlId: ${controlId ?? "MISSING"}`);
  console.log(`sendingApp: ${sendingApp ?? "MISSING"}`);
  console.log(`sendingFacility: ${sendingFacility ?? "MISSING"}`);
  console.log(`timestamp: ${timestamp ?? "MISSING"}`);
  console.log(`mrn: ${mrn ?? "MISSING"}`);
  console.log(`visitNumber: ${visitNumber ?? "MISSING"}`);
  console.log(`OBR count: ${obrCount}`);
  console.log(`OBX count: ${obxCount}`);
  console.log(`segments: ${segmentNames.join(", ")}`);
  console.log(`unknownSegments: ${unknownSegments.length ? unknownSegments.join(", ") : "(none)"}`);
}
