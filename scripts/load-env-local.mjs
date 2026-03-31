import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function loadEnvLocal() {
  if (typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(".env.local");
      return;
    } catch {
      // Fall back to manual parsing below.
    }
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(scriptDir, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separator = normalized.indexOf("=");
    if (separator <= 0) continue;

    const key = normalized.slice(0, separator).trim();
    if (!key || process.env[key] !== undefined) continue;

    const value = normalized.slice(separator + 1).trim();
    process.env[key] = stripQuotes(value);
  }
}
