"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestFile = ingestFile;
const node_path_1 = require("node:path");
const readFile_1 = require("../hl7/readFile");
const parse_1 = require("../hl7/parse");
const adtA01_1 = require("../validate/adtA01");
const errors_1 = require("../validate/errors");
const mapAdtA01_1 = require("../fhir/mapAdtA01");
const bundle_1 = require("../fhir/bundle");
const writeArtifacts_1 = require("../out/writeArtifacts");
async function ingestFile(filePath) {
    const raw = await (0, readFile_1.readHl7File)(filePath);
    const msg = (0, parse_1.parseHl7)(raw);
    try {
        const x = (0, adtA01_1.validateAndExtractAdtA01)(msg);
        const patientFullUrl = `urn:uuid:patient-${x.controlId}`;
        const patient = (0, mapAdtA01_1.mapToPatient)(x); // birthDate/sex are optional in mapper; safe for now
        const encounter = (0, mapAdtA01_1.mapToEncounter)(x, patientFullUrl);
        const bundle = (0, bundle_1.buildAdtTransactionBundle)({
            controlId: x.controlId,
            mrn: x.mrn,
            visitNumber: x.visitNumber,
            patient,
            encounter
        });
        const outPath = (0, node_path_1.join)(process.cwd(), "out", "fhir", `${x.controlId}.bundle.json`);
        await (0, writeArtifacts_1.writeJson)(outPath, bundle);
        console.log("OK");
        console.log(`wrote bundle: ${outPath}`);
        console.log(`controlId: ${x.controlId}`);
        console.log(`mrn: ${x.mrn}`);
        console.log(`visitNumber: ${x.visitNumber}`);
    }
    catch (err) {
        if (err instanceof errors_1.ValidationException) {
            console.error("ERROR: Validation failed");
            for (const e of err.errors) {
                console.error(`- ${e.code}: ${e.message}`);
            }
            process.exit(1);
        }
        throw err;
    }
}
