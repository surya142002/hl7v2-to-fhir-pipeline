import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config({ quiet: true });

type CapabilityStatement = {
  fhirVersion?: string;
  software?: { name?: string; version?: string };
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function joinUrl(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function pingFhir(): Promise<void> {
  const baseUrl = requireEnv("FHIR_BASE_URL");
  const url = joinUrl(baseUrl, "/metadata");

  const res = await axios.get<CapabilityStatement>(url, {
    headers: { Accept: "application/fhir+json" },
    timeout: 10_000,
    validateStatus: () => true
  });

  if (res.status < 200 || res.status >= 300) {
    console.error(`ERROR: HTTP ${res.status} from GET ${url}`);
    const body = res.data ? JSON.stringify(res.data).slice(0, 500) : "";
    if (body) console.error(`Response (truncated): ${body}`);
    process.exit(1);
  }

  const cs = res.data ?? {};
  const fhirVersion = cs.fhirVersion ?? "unknown";
  const softwareName = cs.software?.name ?? "unknown";
  const softwareVersion = cs.software?.version ?? "unknown";

  console.log("OK");
  console.log(`FHIR base: ${baseUrl}`);
  console.log(`FHIR version: ${fhirVersion}`);
  console.log(`Server software: ${softwareName} ${softwareVersion}`.trim());
  process.exit(0);
}
