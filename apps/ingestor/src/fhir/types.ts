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
