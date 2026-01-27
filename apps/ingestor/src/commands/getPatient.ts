import { MRN_SYSTEM } from "../fhir/identity";
import { fhirSearch, expectSingleResult } from "../fhir/search";

function encodeIdentifier(system: string, value: string): string {
  // Encode system and value; keep the identifier separator encoded too
  return `identifier=${encodeURIComponent(system)}%7C${encodeURIComponent(value)}`;
}

export async function getPatient(mrn: string): Promise<void> {
  const q = encodeIdentifier(MRN_SYSTEM, mrn);
  const bundle = await fhirSearch("Patient", q);
  const patient = expectSingleResult(bundle, `Patient identifier ${MRN_SYSTEM}|${mrn}`);

  console.log("OK");
  console.log(`Patient/${patient.id}`);
  const name0 = (patient.name && patient.name[0]) ? patient.name[0] : undefined;
  const family = name0?.family ?? "";
  const given = Array.isArray(name0?.given) ? name0.given.join(" ") : "";
  console.log(`name: ${[given, family].filter(Boolean).join(" ") || "(missing)"}`);
  console.log(`gender: ${patient.gender ?? "(missing)"}`);
  console.log(`birthDate: ${patient.birthDate ?? "(missing)"}`);
}
