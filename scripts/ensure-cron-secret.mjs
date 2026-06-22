import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const environmentPath = path.resolve(".env.local");
let environment = await readFile(environmentPath, "utf8");
if (!/^CRON_SECRET=.+$/m.test(environment)) {
  environment = `${environment.trimEnd()}\nCRON_SECRET="${randomBytes(32).toString("base64url")}"\n`;
  await writeFile(environmentPath, environment, { encoding: "utf8", mode: 0o600 });
  console.info("Workflow cron secret created.");
} else {
  console.info("Workflow cron secret already exists.");
}
