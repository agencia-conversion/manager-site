import { defineConfig, devices } from "@playwright/test";

const preview = process.env.PREVIEW_URL || process.env.BASE_URL;
const local = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: preview || local,
    trace: "off",
  },
  webServer: preview
    ? undefined
    : {
        command: "npx --yes serve -l 4173 public",
        url: local,
        reuseExistingServer: true,
        timeout: 60_000,
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
