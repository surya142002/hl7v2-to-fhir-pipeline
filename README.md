# HL7 v2 → FHIR R4 Ingestion Pipeline (Local, EHR-Style)

## Overview

This project implements a **local healthcare interoperability pipeline** that ingests legacy **HL7 v2 hospital messages** and persists them into a **FHIR R4 server** using **atomic transaction Bundles**.

It mirrors how real EHR systems ingest ADT (patient/encounter) and ORU (lab results) feeds, with a focus on correctness rather than UI or analytics.

**Non-goals**

- No UI
- No cloud services
- No dashboards or ML
- No silent data correction

---

## What This Demonstrates

- Understanding of **HL7 v2 (ADT / ORU)** messaging
- Understanding of **FHIR R4** as a state-based API
- Correct use of **transaction Bundles** for atomic ingestion
- **Idempotent** and **regression-safe** persistence
- Explicit validation and failure handling (no silent drops)

Key principle:

> **HL7 v2 is event-based; FHIR is state-based.**
> This pipeline converts events into consistent, queryable FHIR state.

---

## Architecture (High Level)

```
HL7 v2 file
   ↓
Parse + Normalize
   ↓
Message Validation
   ↓
FHIR Resource Mapping
   ↓
Transaction Bundle (atomic)
   ↓
Local FHIR Server (Postgres)
```

---

## Runtime Environment

- **FHIR Server**: HAPI FHIR JPA (R4)
- **Database**: PostgreSQL
- **Runtime**: Docker Compose (local only)
- **Language**: Node.js + TypeScript

FHIR base URL:

```
http://localhost:8080/fhir
```

---

## Supported Message Types

### ADT^A01 — Patient Admission

**Creates / updates**

- `Patient`
- `Encounter`

**Key behavior**

- Conditional PUT by identifier
- Fully idempotent

**HL7 → FHIR Mapping**

- MRN → `Patient.identifier`
- Name / DOB / Sex → `Patient`
- Visit number → `Encounter.identifier`
- Encounter status → `in-progress`

---

### ORU^R01 — Lab Results

**Creates / updates**

- `Patient`
- `Encounter`
- One or more `Observation` resources

**Key behavior**

- All resources written in **one transaction**
- Deterministic Observation identifiers
- Safe re-ingestion without duplication or regression

**HL7 → FHIR Mapping**

- OBX → `Observation`
- LOINC used when provided
- Numeric vs text values enforced
- Optional timestamps validated strictly

---

## Ingestion Guarantees

### Idempotency

- All resources use **conditional create/update**
- Re-ingesting the same message does not create duplicates

### No Data Regression

- Missing fields in later messages do **not** erase existing data
- Existing Patient/Observation data is preserved when appropriate

### Explicit Failure

- Malformed messages are rejected
- No silent drops or auto-correction

---

## CLI Usage

Run all commands from the `ingestor/` directory.

### Check FHIR server

```bash
npm run ping-fhir
```

### Inspect HL7 (no persistence)

```bash
npm run inspect -- samples/hl7/<file>.hl7
```

### Validate ORU message only

```bash
npm run validate-oru -- samples/hl7/<file>.hl7
```

### Ingest HL7 (ADT or ORU)

```bash
npm run ingest -- samples/hl7/<file>.hl7
```

### Query persisted data

```bash
npm run get-patient -- --mrn <MRN>
npm run get-encounter -- --visit <VISIT>
npm run get-observations -- --mrn <MRN>
```

---

## Sample HL7 Files

Location:

```
samples/hl7/
```

Includes:

- Valid ADT^A01
- Valid ORU^R01 (with multiple OBX)
- Invalid samples demonstrating rejection:

  - Missing MRN
  - Invalid numeric values
  - Missing OBX
  - Invalid timestamps
  - Unsupported message types

All invalid samples fail with explicit validation errors.

---

## Project Structure (Key Files)

```
src/
├── cli.ts
├── hl7/          # File reading + parsing
├── validate/     # Message-specific validation
├── fhir/         # Mapping, identity, bundle creation
├── commands/     # CLI commands
└── out/          # Generated artifacts
```

---

## Current Status

**Complete**

- Local runtime
- ADT^A01 ingestion
- ORU^R01 ingestion
- Atomic transaction Bundles
- Idempotent, regression-safe persistence
- Queryable FHIR state

---

## Optional Future Work (Not Implemented)

- DiagnosticReport (OBR grouping)
- Multiple OBR panels per ORU
- MLLP socket listener
- Audit / Provenance resources
