import { fhirSearch, expectSingleResult } from "./search";

export async function getObservationByIdentifier(system: string, value: string): Promise<any | null> {
  const q = `identifier=${encodeURIComponent(system)}%7C${encodeURIComponent(value)}`;
  const bundle = await fhirSearch("Observation", q);

  const entries = bundle.entry ?? [];
  if (entries.length === 0) return null;
  if (entries.length > 1) {
    throw new Error(`Multiple Observations (${entries.length}) for identifier ${system}|${value} — expected 0 or 1`);
  }
  return expectSingleResult(bundle, `Observation identifier ${system}|${value}`);
}
