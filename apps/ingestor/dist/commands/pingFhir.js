"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingFhir = pingFhir;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ quiet: true });
function requireEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
}
function joinUrl(base, path) {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${b}${p}`;
}
async function pingFhir() {
    const baseUrl = requireEnv("FHIR_BASE_URL");
    const url = joinUrl(baseUrl, "/metadata");
    const res = await axios_1.default.get(url, {
        headers: { Accept: "application/fhir+json" },
        timeout: 10000,
        validateStatus: () => true
    });
    if (res.status < 200 || res.status >= 300) {
        console.error(`ERROR: HTTP ${res.status} from GET ${url}`);
        const body = res.data ? JSON.stringify(res.data).slice(0, 500) : "";
        if (body)
            console.error(`Response (truncated): ${body}`);
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
