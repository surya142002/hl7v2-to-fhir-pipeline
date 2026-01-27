import { ParsedAdtA01 } from "../validate/adtA01";
import { ENCOUNTER_SYSTEM, MRN_SYSTEM } from "./identity";
import { FhirEncounter, FhirPatient } from "./types";

function hl7DobToFhirDate(yyyymmdd?: string): string | undefined {
  if (!yyyymmdd) return undefined;
  const s = yyyymmdd.trim();
  if (!/^\d{8}$/.test(s)) return undefined;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function hl7TsToFhirDateTime(ts?: string): string | undefined {
  if (!ts) return undefined;
  const s = ts.trim();
  if (!/^\d{14}$/.test(s)) return undefined;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}`;
}

function mapSex(sex?: string): FhirPatient["gender"] {
  const v = (sex ?? "").trim().toUpperCase();
  if (v === "M") return "male";
  if (v === "F") return "female";
  if (v === "O") return "other";
  return "unknown";
}

export function mapToPatient(x: ParsedAdtA01): FhirPatient {
  return {
    resourceType: "Patient",
    identifier: [{ system: MRN_SYSTEM, value: x.mrn }],
    name: [{ family: x.familyName || undefined, given: x.givenName ? [x.givenName] : undefined }],
    gender: mapSex(x.sex),
    birthDate: hl7DobToFhirDate(x.birthDate)
  };
}

export function mapToEncounter(x: ParsedAdtA01, patientFullUrl: string): FhirEncounter {
  const start = hl7TsToFhirDateTime(x.admitDateTime);

  return {
    resourceType: "Encounter",
    status: "in-progress",
    identifier: [{ system: ENCOUNTER_SYSTEM, value: x.visitNumber }],
    subject: { reference: patientFullUrl },
    period: start ? { start } : undefined
  };
}
