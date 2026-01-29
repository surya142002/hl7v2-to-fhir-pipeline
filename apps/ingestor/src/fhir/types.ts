export type FhirIdentifier = {
  system?: string;
  value?: string;
};

export type FhirHumanName = {
  family?: string;
  given?: string[];
};

export type FhirReference = {
  reference: string;
};

export type FhirPeriod = {
  start?: string; // FHIR dateTime
  end?: string;
};

export type FhirPatient = {
  resourceType: "Patient";
  identifier?: FhirIdentifier[];
  name?: FhirHumanName[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string; // YYYY-MM-DD
};

export type FhirEncounter = {
  resourceType: "Encounter";
  status: "planned" | "in-progress" | "onhold" | "completed" | "cancelled" | "entered-in-error" | "unknown";
  identifier?: FhirIdentifier[];
  subject: FhirReference;
  period?: FhirPeriod; // NEW
};

export type FhirBundleEntry = {
  fullUrl: string;
  resource: any;
  request: { method: "PUT"; url: string };
};

export type FhirBundle = {
  resourceType: "Bundle";
  type: "transaction";
  entry: FhirBundleEntry[];
};

export type FhirObservation = {
  resourceType: "Observation";
  status: "final" | "registered" | "preliminary" | "amended" | "cancelled" | "entered-in-error" | "unknown";
  identifier?: FhirIdentifier[];
  code: {
    coding?: Array<{ system?: string; code?: string; display?: string }>;
    text?: string;
  };
  subject: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime?: string;
  valueQuantity?: { value?: number; unit?: string };
  valueString?: string;
};
