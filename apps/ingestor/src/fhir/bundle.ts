import { ENCOUNTER_SYSTEM, MRN_SYSTEM } from "./identity";
import { FhirBundle } from "./types";

export function buildAdtTransactionBundle(args: {
  controlId: string;
  mrn: string;
  visitNumber: string;
  patient: any;
  encounter: any;
}): FhirBundle {
  const patientFullUrl = `urn:uuid:patient-${args.controlId}`;
  const encounterFullUrl = `urn:uuid:encounter-${args.controlId}`;

  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: [
      {
        fullUrl: patientFullUrl,
        resource: args.patient,
        request: {
          method: "PUT",
          url: `Patient?identifier=${encodeURIComponent(MRN_SYSTEM)}|${encodeURIComponent(args.mrn)}`
        }
      },
      {
        fullUrl: encounterFullUrl,
        resource: args.encounter,
        request: {
          method: "PUT",
          url: `Encounter?identifier=${encodeURIComponent(ENCOUNTER_SYSTEM)}|${encodeURIComponent(args.visitNumber)}`
        }
      }
    ]
  };
}
