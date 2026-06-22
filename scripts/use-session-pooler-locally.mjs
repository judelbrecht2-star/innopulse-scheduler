import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const environmentPath = path.resolve(".env.local");
let environment = await readFile(environmentPath, "utf8");
const directLine = environment.match(/^DIRECT_URL=(.+)$/m);

if (!directLine) throw new Error("DIRECT_URL is not configured.");

if (/^DATABASE_URL=.+$/m.test(environment)) {
  environment = environment.replace(/^DATABASE_URL=.+$/m, `DATABASE_URL=${directLine[1]}`);
} else {
  environment = `${environment.trimEnd()}\nDATABASE_URL=${directLine[1]}\n`;
}

await writeFile(environmentPath, environment, { encoding: "utf8", mode: 0o600 });
console.info("Local runtime now uses the Supabase session pooler.");
