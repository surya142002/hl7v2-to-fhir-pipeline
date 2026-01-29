import { ParsedOruR01, ParsedObx } from "../validate/oruR01";
import { ENCOUNTER_SYSTEM, MRN_SYSTEM, OBSERVATION_SYSTEM } from "./identity";
import { FhirEncounter, FhirObservation, FhirPatient } from "./types";

function hl7DobToFhirDate(yyyymmdd?: string): string | undefined {
  if (!yyyymmdd) return undefined;
  const s = yyyymmdd.trim();
  if (!/^\d{8}$/.test(s)) return undefined;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function hl7TsToFhirDateTime(ts?: string): string | undefined {
  if (!ts) return undefined;
  const s = ts.trim();
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  if (/^\d{14}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}`;
  }
  return undefined;
}

function parseNumeric(v: string): number | undefined {
  const s = v.trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function mapSystem(systemRaw?: string): string | undefined {
  const s = (systemRaw ?? "").trim().toUpperCase();
  if (s === "LN") return "http://loinc.org";
  return undefined; // do not invent
}

function mapSex(sexRaw?: string): FhirPatient["gender"] {
  const v = (sexRaw ?? "").trim().toUpperCase();
  if (v === "M") return "male";
  if (v === "F") return "female";
  if (v === "O") return "other";
  return "unknown";
}

function buildObservationIdentifier(args: { visitNumber: string; obx: ParsedObx }): string {
  // Deterministic minimal idempotency key:
  // visit|setId|code
  const setId = args.obx.setId ?? "?";
  const code = args.obx.code || "?";
  return `${args.visitNumber}|${setId}|${code}`;
}

export function mapOruToPatient(x: ParsedOruR01): FhirPatient {
  return {
    resourceType: "Patient",
    identifier: [{ system: MRN_SYSTEM, value: x.mrn }],
    name: [{ family: x.familyName || undefined, given: x.givenName ? [x.givenName] : undefined }],
    // NEW: populate so ORU PUT doesn't wipe existing Patient demographics
    gender: mapSex(x.sexRaw),
    birthDate: hl7DobToFhirDate(x.birthDateRaw),
  };
}

export function mapOruToEncounter(x: ParsedOruR01, patientFullUrl: string): FhirEncounter {
  return {
    resourceType: "Encounter",
    status: "in-progress",
    identifier: [{ system: ENCOUNTER_SYSTEM, value: x.visitNumber }],
    subject: { reference: patientFullUrl },
  };
}

export function mapOruToObservations(args: {
  x: ParsedOruR01;
  patientFullUrl: string; // bundle fullUrl, e.g. urn:uuid:patient-<controlId>
  encounterFullUrl: string; // bundle fullUrl, e.g. urn:uuid:encounter-<controlId>
}): FhirObservation[] {
  const { x, patientFullUrl, encounterFullUrl } = args;

  return x.obxs.map((o) => {
    const vt = (o.valueType ?? "").trim().toUpperCase();
    const system = mapSystem(o.systemRaw);
    const effectiveDateTime = hl7TsToFhirDateTime(o.obsTs);

    const obs: FhirObservation = {
      resourceType: "Observation",
      status: "final",
      identifier: [
        {
          system: OBSERVATION_SYSTEM,
          value: buildObservationIdentifier({ visitNumber: x.visitNumber, obx: o }),
        },
      ],
      code: {
        coding: [
          {
            system,
            code: o.code,
            display: o.display,
          },
        ],
        text: o.display || o.code,
      },
      subject: { reference: patientFullUrl },
      encounter: { reference: encounterFullUrl },
      effectiveDateTime: effectiveDateTime ?? undefined,
    };

    if (vt === "NM" || vt === "SN") {
      const num = parseNumeric(o.valueRaw);
      obs.valueQuantity = {
        value: num,
        unit: o.units,
      };
    } else {
      obs.valueString = o.valueRaw;
    }

    return obs;
  });
}
