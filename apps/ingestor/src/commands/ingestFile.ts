import { readHl7File } from "../hl7/readFile";
import { parseHl7 } from "../hl7/parse";
import { validateAndExtractAdtA01 } from "../validate/adtA01";
import { ValidationException } from "../validate/errors";

export async function ingestFile(filePath: string): Promise<void> {
  const raw = await readHl7File(filePath);
  const msg = parseHl7(raw);

  try {
    const x = validateAndExtractAdtA01(msg);

    console.log("OK");
    console.log(`controlId: ${x.controlId}`);
    console.log(`messageType: ${x.messageType}`);
    console.log(`mrn: ${x.mrn}`);
    console.log(`patient: ${x.familyName}, ${x.givenName}`.trim());
    console.log(`visitNumber: ${x.visitNumber}`);
  } catch (err) {
    if (err instanceof ValidationException) {
      console.error("ERROR: Validation failed");
      for (const e of err.errors) {
        console.error(`- ${e.code}: ${e.message}`);
      }
      process.exit(1);
    }
    throw err; // keep current outer handler behavior for non-validation errors
  }
}
