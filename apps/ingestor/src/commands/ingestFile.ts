import { join } from "node:path";

import { readHl7File } from "../hl7/readFile";
import { parseHl7 } from "../hl7/parse";

import { validateAndExtractAdtA01 } from "../validate/adtA01";
import { ValidationException } from "../validate/errors";

import { mapToEncounter, mapToPatient } from "../fhir/mapAdtA01";
import { buildAdtTransactionBundle } from "../fhir/bundle";
import { writeJson } from "../out/writeArtifacts";

export async function ingestFile(filePath: string): Promise<void> {
  const raw = await readHl7File(filePath);
  const msg = parseHl7(raw);

  try {
    const x = validateAndExtractAdtA01(msg);

    const patientFullUrl = `urn:uuid:patient-${x.controlId}`;
    const patient = mapToPatient(x as any); // birthDate/sex are optional in mapper; safe for now
    const encounter = mapToEncounter(x, patientFullUrl);

    const bundle = buildAdtTransactionBundle({
      controlId: x.controlId,
      mrn: x.mrn,
      visitNumber: x.visitNumber,
      patient,
      encounter
    });

    const outPath = join(process.cwd(), "out", "fhir", `${x.controlId}.bundle.json`);
    await writeJson(outPath, bundle);

    console.log("OK");
    console.log(`wrote bundle: ${outPath}`);
    console.log(`controlId: ${x.controlId}`);
    console.log(`mrn: ${x.mrn}`);
    console.log(`visitNumber: ${x.visitNumber}`);
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
