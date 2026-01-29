import { join } from "node:path";

import { readHl7File } from "../hl7/readFile";
import { parseHl7 } from "../hl7/parse";

import { validateAndExtractAdtA01 } from "../validate/adtA01";
import { validateAndExtractOruR01 } from "../validate/oruR01";
import { ValidationException } from "../validate/errors";

import { mapToEncounter, mapToPatient } from "../fhir/mapAdtA01";
import { mapOruToEncounter, mapOruToObservations, mapOruToPatient } from "../fhir/mapOruR01";

import { buildAdtTransactionBundle, buildOruTransactionBundle } from "../fhir/bundle";
import { writeJson } from "../out/writeArtifacts";
import { postTransactionBundle } from "../fhir/postBundle";

import { normalizeMessage } from "../model/normalize";
import { requireSupportedMessageType } from "../validate/messageType";
import { getNormalizedMessageType } from "../hl7/getMessageType";

import { getObservationByIdentifier } from "../fhir/getObservationByIdentifier";
import { OBSERVATION_SYSTEM } from "../fhir/identity";

export async function ingestFile(filePath: string): Promise<void> {
  const raw = await readHl7File(filePath);
  const msg = parseHl7(raw);

  try {
    // Phase 1 contract layer
    const normalized = normalizeMessage(msg);
    requireSupportedMessageType(normalized);

    const mt = getNormalizedMessageType(normalized);
    if (!mt) {
      throw new ValidationException([
        {
          code: "HL7_MSH_9_REQUIRED",
          message: "Missing MSH-9 message type",
          segment: "MSH",
          field: "9",
        },
      ]);
    }

    // Route by message type
    if (mt.code === "ADT" && mt.trigger === "A01") {
      // Existing ADT validator + mapping path (keep unchanged)
      const x = validateAndExtractAdtA01(msg);

      const patientFullUrl = `urn:uuid:patient-${x.controlId}`;
      const patient = mapToPatient(x);
      const encounter = mapToEncounter(x, patientFullUrl);

      const bundle = buildAdtTransactionBundle({
        controlId: x.controlId,
        mrn: x.mrn,
        visitNumber: x.visitNumber,
        patient,
        encounter,
      });

      const outBundlePath = join(process.cwd(), "out", "fhir", `${x.controlId}.bundle.json`);
      await writeJson(outBundlePath, bundle);

      const resp = await postTransactionBundle(bundle);

      const outRespPath = join(process.cwd(), "out", "fhir", `${x.controlId}.response.json`);
      await writeJson(outRespPath, resp);

      console.log("OK");
      console.log(`wrote bundle: ${outBundlePath}`);
      console.log(`wrote response: ${outRespPath}`);
      console.log(`controlId: ${x.controlId}`);
      console.log(`mrn: ${x.mrn}`);
      console.log(`visitNumber: ${x.visitNumber}`);
      return;
    }

    if (mt.code === "ORU" && mt.trigger === "R01") {
      // ORU^R01 ingestion
      const x = validateAndExtractOruR01(msg);

      const patientFullUrl = `urn:uuid:patient-${x.controlId}`;
      const encounterFullUrl = `urn:uuid:encounter-${x.controlId}`;

      const patient = mapOruToPatient(x);
      const encounter = mapOruToEncounter(x, patientFullUrl);
      const observations = mapOruToObservations({ x, patientFullUrl, encounterFullUrl });

      for (const o of observations) {
        const id0 = o.identifier && o.identifier[0] ? o.identifier[0] : undefined;
        const sys = id0?.system ?? OBSERVATION_SYSTEM;
        const val = id0?.value;

        if (!val) continue;

        if (!o.effectiveDateTime) {
          const existing = await getObservationByIdentifier(sys, val);
          const existingEff = existing?.effectiveDateTime;
          if (existingEff) {
            o.effectiveDateTime = existingEff;
          }
        }
      }

      const bundle = buildOruTransactionBundle({
        controlId: x.controlId,
        mrn: x.mrn,
        visitNumber: x.visitNumber,
        patient,
        encounter,
        observations,
      });

      const outBundlePath = join(process.cwd(), "out", "fhir", `${x.controlId}.bundle.json`);
      await writeJson(outBundlePath, bundle);

      const resp = await postTransactionBundle(bundle);

      const outRespPath = join(process.cwd(), "out", "fhir", `${x.controlId}.response.json`);
      await writeJson(outRespPath, resp);

      console.log("OK");
      console.log(`wrote bundle: ${outBundlePath}`);
      console.log(`wrote response: ${outRespPath}`);
      console.log(`controlId: ${x.controlId}`);
      console.log(`mrn: ${x.mrn}`);
      console.log(`visitNumber: ${x.visitNumber}`);
      console.log(`observations: ${observations.length}`);
      return;
    }

    // Shouldn't happen due to requireSupportedMessageType, but keep as a hard guard.
    throw new ValidationException([
      {
        code: "HL7_UNSUPPORTED_MESSAGE",
        message: `Unsupported message type: ${mt.raw}. Only ADT^A01 and ORU^R01 are allowed in Phase 1.`,
        segment: "MSH",
        field: "9",
      },
    ]);
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
