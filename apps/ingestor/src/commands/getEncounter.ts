import { ENCOUNTER_SYSTEM } from "../fhir/identity";
import { fhirSearch, expectSingleResult } from "../fhir/search";

function encodeIdentifier(system: string, value: string): string {
  return `identifier=${encodeURIComponent(system)}%7C${encodeURIComponent(value)}`;
}

export async function getEncounter(visit: string): Promise<void> {
  const q = encodeIdentifier(ENCOUNTER_SYSTEM, visit);
  const bundle = await fhirSearch("Encounter", q);
  const enc = expectSingleResult(bundle, `Encounter identifier ${ENCOUNTER_SYSTEM}|${visit}`);

  console.log("OK");
  console.log(`Encounter/${enc.id}`);
  console.log(`status: ${enc.status ?? "(missing)"}`);
  console.log(`subject: ${enc.subject?.reference ?? "(missing)"}`);
}
