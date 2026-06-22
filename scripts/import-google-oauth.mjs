import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const credentialsPath = process.argv[2];

if (!credentialsPath) {
  throw new Error("Pass the path to a downloaded Google OAuth credentials JSON file.");
}

const credentials = JSON.parse(await readFile(credentialsPath, "utf8"));
const web = credentials.web;

if (!web?.client_id?.endsWith(".apps.googleusercontent.com") || !web?.client_secret) {
  throw new Error("The file does not contain Web application OAuth credentials.");
}

const localCallback = "http://localhost:3000/api/auth/callback/google";
if (!web.redirect_uris?.includes(localCallback)) {
  throw new Error(`The Google OAuth client is missing this redirect URI: ${localCallback}`);
}

const environmentPath = path.resolve(".env.local");
let environment = "";

try {
  environment = await readFile(environmentPath, "utf8");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

function upsert(key, value) {
  const line = `${key}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  environment = pattern.test(environment)
    ? environment.replace(pattern, line)
    : `${environment.trimEnd()}${environment.trim() ? "\n" : ""}${line}\n`;
}

upsert("NEXTAUTH_URL", "http://localhost:3000");

if (!/^NEXTAUTH_SECRET=.+$/m.test(environment)) {
  upsert("NEXTAUTH_SECRET", randomBytes(32).toString("base64url"));
}

upsert("GOOGLE_CLIENT_ID", web.client_id);
upsert("GOOGLE_CLIENT_SECRET", web.client_secret);

await writeFile(environmentPath, environment, { encoding: "utf8", mode: 0o600 });

console.info("Google OAuth credentials imported into .env.local.");
console.info("Validated the local Google callback URI.");
