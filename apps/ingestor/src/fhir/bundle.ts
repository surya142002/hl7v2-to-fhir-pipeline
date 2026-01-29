import { ENCOUNTER_SYSTEM, MRN_SYSTEM, OBSERVATION_SYSTEM } from "./identity";
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
          method: "PUT" as const,
          url: `Patient?identifier=${encodeURIComponent(MRN_SYSTEM)}|${encodeURIComponent(args.mrn)}`
        }
      },
      {
        fullUrl: encounterFullUrl,
        resource: args.encounter,
        request: {
          method: "PUT" as const,
          url: `Encounter?identifier=${encodeURIComponent(ENCOUNTER_SYSTEM)}|${encodeURIComponent(args.visitNumber)}`
        }
      }
    ]
  };
}

export function buildOruTransactionBundle(args: {
  controlId: string;
  mrn: string;
  visitNumber: string;
  patient: any;
  encounter: any;
  observations: any[];
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
          method: "PUT" as const,
          url: `Patient?identifier=${encodeURIComponent(MRN_SYSTEM)}|${encodeURIComponent(args.mrn)}`
        }
      },
      {
        fullUrl: encounterFullUrl,
        resource: args.encounter,
        request: {
          method: "PUT" as const,
          url: `Encounter?identifier=${encodeURIComponent(ENCOUNTER_SYSTEM)}|${encodeURIComponent(args.visitNumber)}`
        }
      },
      ...args.observations.map((o, idx) => {
        const id0 = (o.identifier && o.identifier[0]) ? o.identifier[0] : {};
        const sys = id0.system ?? OBSERVATION_SYSTEM;
        const val = id0.value ?? `${args.visitNumber}|${idx + 1}|unknown`;

        return {
          fullUrl: `urn:uuid:observation-${args.controlId}-${idx + 1}`,
          resource: o,
          request: {
            method: "PUT" as const,
            url: `Observation?identifier=${encodeURIComponent(sys)}|${encodeURIComponent(val)}`
          }
        };
      })
    ]
  };
}
