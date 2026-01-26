"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndExtractAdtA01 = validateAndExtractAdtA01;
const errors_1 = require("./errors");
function requireSegment(msg, name) {
    const seg = msg.segments.find((s) => s.name === name);
    if (!seg) {
        throw new errors_1.ValidationException([
            { code: `HL7_MISSING_${name}`, message: `Missing ${name} segment`, segment: name }
        ]);
    }
    return seg;
}
function getField(seg, n) {
    return (seg.fields[n] ?? "").trim();
}
function firstRepetition(field) {
    return (field.split("~")[0] ?? "").trim();
}
function component(field, idx1) {
    const parts = field.split("^");
    return (parts[idx1 - 1] ?? "").trim();
}
function validateAndExtractAdtA01(msg) {
    const errors = [];
    const msh = requireSegment(msg, "MSH");
    const pid = requireSegment(msg, "PID");
    const pv1 = requireSegment(msg, "PV1");
    const messageType = getField(msh, 9);
    const controlId = getField(msh, 10);
    if (!messageType) {
        errors.push({ code: "HL7_MSH_9_REQUIRED", message: "Missing MSH-9 message type", segment: "MSH", field: "9" });
    }
    else {
        const [msgCode, trigger] = messageType.split("^").map((s) => s.trim());
        if (!(msgCode === "ADT" && trigger === "A01")) {
            errors.push({
                code: "HL7_UNSUPPORTED_MESSAGE",
                message: `Unsupported message type: ${messageType}. Only ADT^A01 is allowed in Phase 1A.`,
                segment: "MSH",
                field: "9"
            });
        }
    }
    if (!controlId) {
        errors.push({ code: "HL7_MSH_10_REQUIRED", message: "Missing MSH-10 control ID", segment: "MSH", field: "10" });
    }
    const pid3 = getField(pid, 3);
    const mrn = component(firstRepetition(pid3), 1);
    if (!mrn) {
        errors.push({ code: "HL7_PID_3_REQUIRED", message: "Missing MRN in PID-3 (CX.1)", segment: "PID", field: "3" });
    }
    const pid5 = getField(pid, 5);
    const familyName = component(pid5, 1);
    const givenName = component(pid5, 2);
    if (!familyName && !givenName) {
        errors.push({ code: "HL7_PID_5_REQUIRED", message: "Missing patient name in PID-5", segment: "PID", field: "5" });
    }
    const pv1_19 = getField(pv1, 19);
    const visitNumber = component(firstRepetition(pv1_19), 1);
    if (!visitNumber) {
        errors.push({
            code: "HL7_PV1_19_REQUIRED",
            message: "Missing visit/encounter number in PV1-19 (CX.1)",
            segment: "PV1",
            field: "19"
        });
    }
    if (errors.length)
        throw new errors_1.ValidationException(errors);
    return {
        messageType,
        controlId,
        mrn,
        familyName,
        givenName,
        visitNumber
    };
}
