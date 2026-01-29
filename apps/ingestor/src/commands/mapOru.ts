import { readHl7File } from "../hl7/readFile";
import { parseHl7 } from "../hl7/parse";
import { validateAndExtractOruR01 } from "../validate/oruR01";
import { ValidationException } from "../validate/errors";
import { mapOruToObservations } from "../fhir/mapOruR01";

export async function mapOru(filePath: string): Promise<void> {
  const raw = await readHl7File(filePath);
  const msg = parseHl7(raw);

  try {
    const x = validateAndExtractOruR01(msg);

    // For this step, references are placeholders.
    // Next step (bundling) will switch these to fullUrl references.
    const patientRef = `Patient?identifier=urn:id:mrn|${x.mrn}`;
    const encounterRef = `Encounter?identifier=urn:id:encounter|${x.visitNumber}`;

    const observations = mapOruToObservations({ x, patientRef, encounterRef });

    console.log("OK");
    console.log(`file: ${filePath}`);
    console.log(`controlId: ${x.controlId}`);
    console.log(`observations: ${observations.length}`);
    console.log(JSON.stringify(observations, null, 2));
  } catch (err) {
    if (err instanceof ValidationException) {
      console.error("ERROR: Validation failed");
      for (const e of err.errors) console.error(`- ${e.code}: ${e.message}`);
      process.exit(1);
    }
    throw err;
  }
}
