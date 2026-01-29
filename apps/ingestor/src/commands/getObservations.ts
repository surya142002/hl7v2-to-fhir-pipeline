import { MRN_SYSTEM } from "../fhir/identity";
import { fhirSearch } from "../fhir/search";

function encodeIdentifier(system: string, value: string): string {
  return `subject.identifier=${encodeURIComponent(system)}%7C${encodeURIComponent(value)}`;
}

export async function getObservations(mrn: string): Promise<void> {
  const q = encodeIdentifier(MRN_SYSTEM, mrn);
  const bundle = await fhirSearch("Observation", q);

  const entries = bundle.entry ?? [];
  console.log("OK");
  console.log(`total: ${bundle.total ?? entries.length}`);

  for (const e of entries.slice(0, 20)) {
    const o = e.resource ?? {};
    const code0 = o.code?.coding?.[0]?.code ?? "(missing)";
    const disp0 = o.code?.coding?.[0]?.display ?? o.code?.text ?? "";
    const eff = o.effectiveDateTime ?? "(missing)";
    const valQ = o.valueQuantity?.value;
    const unit = o.valueQuantity?.unit;
    const valS = o.valueString;

    const value = (valQ !== undefined) ? `${valQ}${unit ? " " + unit : ""}` : (valS ?? "(missing)");
    console.log(`- Observation/${o.id ?? "(no-id)"} code=${code0} ${disp0 ? `"${disp0}"` : ""} value=${value} effective=${eff}`);
  }
}
