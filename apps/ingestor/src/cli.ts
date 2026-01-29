import { pingFhir } from "./commands/pingFhir";
import { ingestFile } from "./commands/ingestFile";
import { inspectFile } from "./commands/inspectFile";
import { getPatient } from "./commands/getPatient";
import { getEncounter } from "./commands/getEncounter";
import { validateOru } from "./commands/validateOru";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  const usage =
    "Usage:\n" +
    "  npm run ping-fhir\n" +
    "  npm run ingest -- <path>\n" +
    "  npm run inspect -- <path>\n" +
    "  npm run validate-oru -- <path>\n" +
    "  npm run get-patient -- --mrn <MRN>\n" +
    "  npm run get-encounter -- --visit <VISIT>";

  if (!command) {
    console.error(`ERROR: Missing command.\n${usage}`);
    process.exit(2);
  }

  switch (command) {
    case "ping-fhir":
      await pingFhir();
      return;

    case "ingest": {
      const filePath = args[1];
      if (!filePath) {
        console.error(`ERROR: Missing file path.\nUsage: npm run ingest -- <path>`);
        process.exit(2);
      }
      await ingestFile(filePath);
      return;
    }

    case "inspect": {
      const filePath = args[1];
      if (!filePath) {
        console.error(`ERROR: Missing file path.\nUsage: npm run inspect -- <path>`);
        process.exit(2);
      }
      await inspectFile(filePath);
      return;
    }

    case "validate-oru": {
      const filePath = args[1];
      if (!filePath) {
        console.error(`ERROR: Missing file path.\nUsage: npm run validate-oru -- <path>`);
        process.exit(2);
      }
      await validateOru(filePath);
      return;
    }

    case "get-patient": {
      const flag = args[1];
      const mrn = args[2];
      if (flag !== "--mrn" || !mrn) {
        console.error(`ERROR: Invalid arguments.\nUsage: npm run get-patient -- --mrn <MRN>`);
        process.exit(2);
      }
      await getPatient(mrn);
      return;
    }

    case "get-encounter": {
      const flag = args[1];
      const visit = args[2];
      if (flag !== "--visit" || !visit) {
        console.error(`ERROR: Invalid arguments.\nUsage: npm run get-encounter -- --visit <VISIT>`);
        process.exit(2);
      }
      await getEncounter(visit);
      return;
    }

    default:
      console.error(`ERROR: Unknown command: ${command}\n${usage}`);
      process.exit(2);
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`ERROR: Unhandled failure: ${msg}`);
  process.exit(1);
});
