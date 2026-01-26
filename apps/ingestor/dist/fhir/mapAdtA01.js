"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToPatient = mapToPatient;
exports.mapToEncounter = mapToEncounter;
const identity_1 = require("./identity");
function hl7DobToFhirDate(yyyymmdd) {
    if (!yyyymmdd)
        return undefined;
    const s = yyyymmdd.trim();
    if (!/^\d{8}$/.test(s))
        return undefined;
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
function mapSex(sex) {
    const v = (sex ?? "").trim().toUpperCase();
    if (v === "M")
        return "male";
    if (v === "F")
        return "female";
    if (v === "O")
        return "other";
    return "unknown";
}
function mapToPatient(x) {
    return {
        resourceType: "Patient",
        identifier: [{ system: identity_1.MRN_SYSTEM, value: x.mrn }],
        name: [{ family: x.familyName || undefined, given: x.givenName ? [x.givenName] : undefined }],
        gender: mapSex(x.sex),
        birthDate: hl7DobToFhirDate(x.birthDate)
    };
}
function mapToEncounter(x, patientFullUrl) {
    return {
        resourceType: "Encounter",
        status: "in-progress",
        identifier: [{ system: identity_1.ENCOUNTER_SYSTEM, value: x.visitNumber }],
        subject: { reference: patientFullUrl }
    };
}
