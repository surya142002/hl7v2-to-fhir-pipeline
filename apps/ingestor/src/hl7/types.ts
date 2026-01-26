export type HL7Segment = {
    name: string;     // "MSH", "PID", "PV1", etc.
    raw: string;      // original line text (trimmed)
    fields: string[]; // 1-based fields: fields[1] is first field after segment name
  };
  
  export type HL7Message = {
    raw: string;
    fieldSep: string;
    segments: HL7Segment[];
  };
  