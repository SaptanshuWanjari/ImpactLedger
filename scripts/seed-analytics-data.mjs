import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runScript(fileName) {
  const scriptPath = path.join(__dirname, fileName);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

runScript("seed-auth-users.mjs");
runScript("seed-mock-data.mjs");

console.log("Analytics mock data seed complete.");
