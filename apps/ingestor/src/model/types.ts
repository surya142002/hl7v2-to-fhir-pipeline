export type MshModel = {
    messageType?: string;      // MSH-9 raw
    controlId?: string;        // MSH-10
    sendingApp?: string;       // MSH-3
    sendingFacility?: string;  // MSH-4
    timestamp?: string;        // MSH-7
  };
  
  export type PidModel = {
    mrn?: string;              // PID-3.1 (first repetition)
    familyName?: string;       // PID-5.1
    givenName?: string;        // PID-5.2
    birthDateRaw?: string;     // PID-7 raw
    sexRaw?: string;           // PID-8 raw
  };
  
  export type Pv1Model = {
    visitNumber?: string;      // PV1-19.1 (first repetition)
    admitDateTimeRaw?: string; // PV1-44 raw (optional)
  };
  
  export type ObrModel = {
    raw: string;
  };
  
  export type ObxModel = {
    raw: string;
  };
  
  export type ParsedMessage = {
    msh: MshModel;
    pid?: PidModel;
    pv1?: Pv1Model;
    obrs: ObrModel[];
    obxs: ObxModel[];
    segmentNames: string[];
    rawSegments: { name: string; raw: string }[];
    unknownSegments: string[];
  };
  