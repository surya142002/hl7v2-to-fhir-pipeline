import { readHl7File } from "../hl7/readFile";
import { parseHl7 } from "../hl7/parse";
import { normalizeMessage } from "../model/normalize";
import { requireSupportedMessageType } from "../validate/messageType";
import { ValidationException } from "../validate/errors";

export async function inspectFile(filePath: string): Promise<void> {
  const raw = await readHl7File(filePath);
  const msg = parseHl7(raw);

  try {
    const x = normalizeMessage(msg);
    requireSupportedMessageType(x);

    const messageType = x.msh.messageType ?? "MISSING";
    const controlId = x.msh.controlId ?? "MISSING";
    const sendingApp = x.msh.sendingApp ?? "MISSING";
    const sendingFacility = x.msh.sendingFacility ?? "MISSING";
    const timestamp = x.msh.timestamp ?? "MISSING";

    const mrn = x.pid?.mrn ?? "MISSING";
    const visitNumber = x.pv1?.visitNumber ?? "MISSING";

    console.log("OK");
    console.log(`file: ${filePath}`);
    console.log(`messageType: ${messageType}`);
    console.log(`controlId: ${controlId}`);
    console.log(`sendingApp: ${sendingApp}`);
    console.log(`sendingFacility: ${sendingFacility}`);
    console.log(`timestamp: ${timestamp}`);
    console.log(`mrn: ${mrn}`);
    console.log(`visitNumber: ${visitNumber}`);
    console.log(`pv1-44 admitDateTimeRaw: ${x.pv1?.admitDateTimeRaw ?? "MISSING"}`);
    console.log(`OBR count: ${x.obrs.length}`);
    console.log(`OBX count: ${x.obxs.length}`);
    console.log(`segments: ${x.segmentNames.join(", ")}`);
    console.log(`unknownSegments: ${x.unknownSegments.length ? x.unknownSegments.join(", ") : "(none)"}`);
  } catch (err) {
    if (err instanceof ValidationException) {
      console.error("ERROR: Validation failed");
      for (const e of err.errors) {
        console.error(`- ${e.code}: ${e.message}`);
      }
      process.exit(1);
    }
    throw err;
  }
}
