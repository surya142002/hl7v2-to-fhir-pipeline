import { ParsedOruR01, ParsedObx } from "../validate/oruR01";
import { FhirObservation } from "./types";

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

function buildObservationIdentifier(args: { visitNumber: string; obx: ParsedObx }): string {
  // Deterministic but minimal idempotency key (good enough for this phase)
  // visit|setId|code
  const setId = args.obx.setId ?? "?";
  const code = args.obx.code || "?";
  return `${args.visitNumber}|${setId}|${code}`;
}

export function mapOruToObservations(args: {
  x: ParsedOruR01;
  patientRef: string;   // placeholder reference for now
  encounterRef: string; // placeholder reference for now
}): FhirObservation[] {
  const { x, patientRef, encounterRef } = args;

  return x.obxs.map((o) => {
    const vt = (o.valueType ?? "").trim().toUpperCase();
    const system = mapSystem(o.systemRaw);
    const effectiveDateTime = hl7TsToFhirDateTime(o.obsTs);

    const obs: FhirObservation = {
      resourceType: "Observation",
      status: "final",
      identifier: [
        {
          system: "urn:id:observation",
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
      subject: { reference: patientRef },
      encounter: { reference: encounterRef },
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
