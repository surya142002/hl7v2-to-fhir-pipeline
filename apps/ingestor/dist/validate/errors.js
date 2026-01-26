"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationException = void 0;
class ValidationException extends Error {
    constructor(errors) {
        super(errors.map((e) => `${e.code}: ${e.message}`).join("; "));
        this.errors = errors;
    }
}
exports.ValidationException = ValidationException;
