import { pingFhir } from "./commands/pingFhir";
import { ingestFile } from "./commands/ingestFile";
import { inspectFile } from "./commands/inspectFile"; // NEW

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error("ERROR: Missing command.\nUsage: npm run ping-fhir | npm run ingest -- <path> | npm run inspect -- <path>");
    process.exit(2);
  }

  switch (command) {
    case "ping-fhir":
      await pingFhir();
      return;

    case "ingest": {
      const filePath = args[1];
      if (!filePath) {
        console.error("ERROR: Missing file path.\nUsage: npm run ingest -- <path>");
        process.exit(2);
      }
      await ingestFile(filePath);
      return;
    }

    case "inspect": { // NEW
      const filePath = args[1];
      if (!filePath) {
        console.error("ERROR: Missing file path.\nUsage: npm run inspect -- <path>");
        process.exit(2);
      }
      await inspectFile(filePath);
      return;
    }

    default:
      console.error(`ERROR: Unknown command: ${command}\nUsage: npm run ping-fhir | npm run ingest -- <path> | npm run inspect -- <path>`);
      process.exit(2);
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`ERROR: Unhandled failure: ${msg}`);
  process.exit(1);
});
