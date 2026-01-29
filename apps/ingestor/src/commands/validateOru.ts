import { readHl7File } from "../hl7/readFile";
import { parseHl7 } from "../hl7/parse";
import { validateAndExtractOruR01 } from "../validate/oruR01";
import { ValidationException } from "../validate/errors";

export async function validateOru(filePath: string): Promise<void> {
  const raw = await readHl7File(filePath);
  const msg = parseHl7(raw);

  try {
    const x = validateAndExtractOruR01(msg);

    console.log("OK");
    console.log(`file: ${filePath}`);
    console.log(`messageType: ${x.messageType}`);
    console.log(`controlId: ${x.controlId}`);
    console.log(`mrn: ${x.mrn}`);
    console.log(`visitNumber: ${x.visitNumber}`);
    console.log(`OBR count: ${x.obrCount}`);
    console.log(`OBX parsed: ${x.obxs.length}`);

    for (const o of x.obxs) {
      const disp = o.display ? ` "${o.display}"` : "";
      const sys = o.systemRaw ? ` [${o.systemRaw}]` : "";
      const units = o.units ? ` ${o.units}` : "";
      const ts = o.obsTs ? ` ts=${o.obsTs}` : "";
      console.log(`- ${o.valueType} ${o.code}${disp}${sys} = ${o.valueRaw}${units}${ts}`);
    }
  } catch (err) {
    if (err instanceof ValidationException) {
      console.error("ERROR: Validation failed");
      for (const e of err.errors) console.error(`- ${e.code}: ${e.message}`);
      process.exit(1);
    }
    throw err;
  }
}
