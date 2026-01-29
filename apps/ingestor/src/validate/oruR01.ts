import { HL7Message, HL7Segment } from "../hl7/types";
import { ValidationError, ValidationException } from "./errors";

function requireSegment(msg: HL7Message, name: string): HL7Segment {
  const seg = msg.segments.find((s) => s.name === name);
  if (!seg) {
    throw new ValidationException([
      { code: `HL7_MISSING_${name}`, message: `Missing ${name} segment`, segment: name },
    ]);
  }
  return seg;
}

function getField(seg: HL7Segment, n: number): string {
  return (seg.fields[n] ?? "").trim();
}

function firstRepetition(field: string): string {
  return (field.split("~")[0] ?? "").trim();
}

function component(field: string, idx1: number): string {
  const parts = field.split("^");
  return (parts[idx1 - 1] ?? "").trim();
}

function requireTsIfPresent(
  ts: string | undefined,
  code: string,
  segment: string,
  field: string
): ValidationError | null {
  if (!ts) return null;
  const s = ts.trim();
  // allow YYYYMMDD or YYYYMMDDHHMMSS
  if (!/^\d{8}(\d{6})?$/.test(s)) {
    return {
      code,
      message: `Invalid timestamp format: ${s}. Expected YYYYMMDD or YYYYMMDDHHMMSS`,
      segment,
      field,
    };
  }
  return null;
}

function parseNumericStrict(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export type ParsedObx = {
  setId?: string; // OBX-1
  valueType: string; // OBX-2 (required)
  code: string; // OBX-3.1 (required)
  display?: string; // OBX-3.2 (optional)
  systemRaw?: string; // OBX-3.3 (optional)
  valueRaw: string; // OBX-5 (required)
  units?: string; // OBX-6.1 (optional)
  obsTs?: string; // OBX-14 (optional)
};

export type ParsedOruR01 = {
  messageType: string; // MSH-9
  controlId: string; // MSH-10
  mrn: string; // PID-3.1
  familyName: string; // PID-5.1
  givenName: string; // PID-5.2

  // NEW: demographics (used to avoid wiping Patient on PUT)
  birthDateRaw?: string; // PID-7 raw (YYYYMMDD)
  sexRaw?: string; // PID-8 raw

  visitNumber: string; // PV1-19.1
  obrCount: number;
  obxs: ParsedObx[];
};

export function validateAndExtractOruR01(msg: HL7Message): ParsedOruR01 {
  const errors: ValidationError[] = [];

  const msh = requireSegment(msg, "MSH");
  const pid = requireSegment(msg, "PID");
  const pv1 = requireSegment(msg, "PV1");

  const messageType = getField(msh, 9);
  const controlId = getField(msh, 10);

  if (!messageType) {
    errors.push({
      code: "HL7_MSH_9_REQUIRED",
      message: "Missing MSH-9 message type",
      segment: "MSH",
      field: "9",
    });
  } else {
    const [msgCode, trigger] = messageType.split("^").map((s) => s.trim());
    if (!(msgCode === "ORU" && trigger === "R01")) {
      errors.push({
        code: "HL7_UNSUPPORTED_MESSAGE",
        message: `Unsupported message type: ${messageType}. Expected ORU^R01.`,
        segment: "MSH",
        field: "9",
      });
    }
  }

  if (!controlId) {
    errors.push({
      code: "HL7_MSH_10_REQUIRED",
      message: "Missing MSH-10 control ID",
      segment: "MSH",
      field: "10",
    });
  }

  const pid3 = getField(pid, 3);
  const mrn = component(firstRepetition(pid3), 1);
  if (!mrn) {
    errors.push({
      code: "HL7_PID_3_REQUIRED",
      message: "Missing MRN in PID-3 (CX.1)",
      segment: "PID",
      field: "3",
    });
  }

  const pid5 = getField(pid, 5);
  const familyName = component(pid5, 1);
  const givenName = component(pid5, 2);
  if (!familyName && !givenName) {
    errors.push({
      code: "HL7_PID_5_REQUIRED",
      message: "Missing patient name in PID-5",
      segment: "PID",
      field: "5",
    });
  }

  // NEW: PID-7 + PID-8 (optional but strict if present)
  const birthDateRaw = getField(pid, 7) || undefined;
  if (birthDateRaw && !/^\d{8}$/.test(birthDateRaw.trim())) {
    errors.push({
      code: "HL7_PID_7_INVALID",
      message: "PID-7 must be YYYYMMDD if present",
      segment: "PID",
      field: "7",
    });
  }

  const sexRaw = getField(pid, 8) || undefined;

  const pv1_19 = getField(pv1, 19);
  const visitNumber = component(firstRepetition(pv1_19), 1);
  if (!visitNumber) {
    errors.push({
      code: "HL7_PV1_19_REQUIRED",
      message: "Missing visit/encounter number in PV1-19 (CX.1)",
      segment: "PV1",
      field: "19",
    });
  }

  const obrCount = msg.segments.filter((s) => s.name === "OBR").length;
  const obxSegments = msg.segments.filter((s) => s.name === "OBX");

  if (obrCount < 1) {
    errors.push({
      code: "HL7_MISSING_OBR",
      message: "ORU^R01 requires at least one OBR",
      segment: "OBR",
    });
  }
  if (obxSegments.length < 1) {
    errors.push({
      code: "HL7_MISSING_OBX",
      message: "ORU^R01 requires at least one OBX",
      segment: "OBX",
    });
  }

  const obxs: ParsedObx[] = [];

  for (const obx of obxSegments) {
    const setId = getField(obx, 1) || undefined;
    const valueType = getField(obx, 2);

    const obx3 = getField(obx, 3);
    const code = component(obx3, 1);
    const display = component(obx3, 2) || undefined;
    const systemRaw = component(obx3, 3) || undefined;

    const valueRaw = getField(obx, 5);
    const units = component(getField(obx, 6), 1) || undefined;

    const obsTs = getField(obx, 14) || undefined;

    if (!valueType) {
      errors.push({
        code: "HL7_OBX_2_REQUIRED",
        message: "Missing OBX-2 value type",
        segment: "OBX",
        field: "2",
      });
    }
    if (!code) {
      errors.push({
        code: "HL7_OBX_3_REQUIRED",
        message: "Missing OBX-3 observation code (OBX-3.1)",
        segment: "OBX",
        field: "3",
      });
    }
    if (!valueRaw) {
      errors.push({
        code: "HL7_OBX_5_REQUIRED",
        message: "Missing OBX-5 value",
        segment: "OBX",
        field: "5",
      });
    }

    const tsErr = requireTsIfPresent(obsTs, "HL7_OBX_14_INVALID", "OBX", "14");
    if (tsErr) errors.push(tsErr);

    const vt = (valueType ?? "").trim().toUpperCase();
    if (valueRaw && (vt === "NM" || vt === "SN")) {
      const n = parseNumericStrict(valueRaw);
      if (n === null) {
        errors.push({
          code: "HL7_OBX_5_INVALID_NUMERIC",
          message: `OBX-5 must be numeric when OBX-2 is ${vt}. Got: "${valueRaw}"`,
          segment: "OBX",
          field: "5",
        });
      }
    }

    obxs.push({
      setId,
      valueType: valueType ?? "",
      code,
      display,
      systemRaw,
      valueRaw,
      units,
      obsTs,
    });
  }

  if (errors.length) throw new ValidationException(errors);

  return {
    messageType,
    controlId,
    mrn,
    familyName,
    givenName,
    birthDateRaw,
    sexRaw,
    visitNumber,
    obrCount,
    obxs,
  };
}
