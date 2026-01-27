import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config({ quiet: true });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) throw new Error(`Missing required environment variable: ${name}`);
  return value.trim();
}

function joinUrl(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export type FhirBundle = {
  resourceType: "Bundle";
  type?: string;
  total?: number;
  entry?: Array<{ resource?: any }>;
};

export async function fhirSearch(resourceType: string, query: string): Promise<FhirBundle> {
  const baseUrl = requireEnv("FHIR_BASE_URL");
  const url = joinUrl(baseUrl, `/${resourceType}?${query}`);

  const res = await axios.get(url, {
    headers: { Accept: "application/fhir+json" },
    timeout: 10_000,
    validateStatus: () => true,
  });

  if (res.status < 200 || res.status >= 300) {
    const body = res.data ? JSON.stringify(res.data).slice(0, 1000) : "";
    throw new Error(`FHIR search failed: HTTP ${res.status} GET ${url}. Response (truncated): ${body}`);
  }

  return res.data as FhirBundle;
}

export function expectSingleResult(bundle: FhirBundle, label: string): any {
  const entries = bundle.entry ?? [];
  if (entries.length === 0) throw new Error(`No results for ${label}`);
  if (entries.length > 1) throw new Error(`Multiple results (${entries.length}) for ${label} — expected exactly 1`);
  const resource = entries[0]?.resource;
  if (!resource) throw new Error(`Search result missing resource for ${label}`);
  return resource;
}
