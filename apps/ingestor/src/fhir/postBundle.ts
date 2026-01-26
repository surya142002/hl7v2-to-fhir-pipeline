import axios from "axios";
import * as dotenv from "dotenv";
import { FhirBundle } from "./types";

dotenv.config({ quiet: true });

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

export async function postTransactionBundle(bundle: FhirBundle): Promise<any> {
  const baseUrl = requireEnv("FHIR_BASE_URL");

  // For FHIR transaction, POST the Bundle to the FHIR base endpoint (e.g., http://localhost:8080/fhir)
  const url = joinUrl(baseUrl, "/");

  const res = await axios.post(url, bundle, {
    headers: {
      "Content-Type": "application/fhir+json",
      Accept: "application/fhir+json"
    },
    timeout: 20_000,
    validateStatus: () => true
  });

  if (res.status < 200 || res.status >= 300) {
    const body = res.data ? JSON.stringify(res.data).slice(0, 1500) : "";
    throw new Error(`FHIR transaction failed: HTTP ${res.status}. Response (truncated): ${body}`);
  }

  return res.data;
}
