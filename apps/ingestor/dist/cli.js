"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pingFhir_1 = require("./commands/pingFhir");
const ingestFile_1 = require("./commands/ingestFile");
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command) {
        console.error("ERROR: Missing command.\nUsage: npm run ping-fhir | npm run ingest -- <path>");
        process.exit(2);
    }
    switch (command) {
        case "ping-fhir":
            await (0, pingFhir_1.pingFhir)();
            return;
        case "ingest": {
            const filePath = args[1];
            if (!filePath) {
                console.error("ERROR: Missing file path.\nUsage: npm run ingest -- <path>");
                process.exit(2);
            }
            await (0, ingestFile_1.ingestFile)(filePath);
            return;
        }
        default:
            console.error(`ERROR: Unknown command: ${command}\nUsage: npm run ping-fhir | npm run ingest -- <path>`);
            process.exit(2);
    }
}
main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`ERROR: Unhandled failure: ${msg}`);
    process.exit(1);
});
