import { pingFhir } from "./commands/pingFhir";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error("ERROR: Missing command.\nUsage: npm run ping-fhir");
    process.exit(2);
  }

  switch (command) {
    case "ping-fhir":
      await pingFhir();
      return;

    default:
      console.error(`ERROR: Unknown command: ${command}\nUsage: npm run ping-fhir`);
      process.exit(2);
  }
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`ERROR: Unhandled failure: ${msg}`);
  process.exit(1);
});
