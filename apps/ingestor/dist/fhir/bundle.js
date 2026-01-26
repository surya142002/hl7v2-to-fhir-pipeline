"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdtTransactionBundle = buildAdtTransactionBundle;
const identity_1 = require("./identity");
function buildAdtTransactionBundle(args) {
    const patientFullUrl = `urn:uuid:patient-${args.controlId}`;
    const encounterFullUrl = `urn:uuid:encounter-${args.controlId}`;
    return {
        resourceType: "Bundle",
        type: "transaction",
        entry: [
            {
                fullUrl: patientFullUrl,
                resource: args.patient,
                request: {
                    method: "PUT",
                    url: `Patient?identifier=${encodeURIComponent(identity_1.MRN_SYSTEM)}|${encodeURIComponent(args.mrn)}`
                }
            },
            {
                fullUrl: encounterFullUrl,
                resource: args.encounter,
                request: {
                    method: "PUT",
                    url: `Encounter?identifier=${encodeURIComponent(identity_1.ENCOUNTER_SYSTEM)}|${encodeURIComponent(args.visitNumber)}`
                }
            }
        ]
    };
}
