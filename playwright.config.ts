import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const preview = process.env.PREVIEW_URL || process.env.BASE_URL;
const local = "http://127.0.0.1:4173";

/** Load .dev.vars into process.env when not already set (local only). */
function loadDevVars() {
  const path = resolve(process.cwd(), ".dev.vars");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    const val = trimmed.slice(i + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

if (!preview) loadDevVars();

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: {
    baseURL: preview || local,
    trace: "off",
  },
  webServer: preview
    ? undefined
    : {
        command: "npx wrangler pages dev ./public --port 4173 --ip 127.0.0.1",
        url: local,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
