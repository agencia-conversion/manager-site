import { defineConfig, devices } from '@playwright/test'

const preview = process.env.PREVIEW_URL || process.env.BASE_URL
const local = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: preview || local,
    trace: 'off',
  },
  webServer: preview
    ? undefined
    : {
        command: 'npm run dev -- --port 4173',
        url: local,
        reuseExistingServer: true,
        timeout: 180_000,
        env: {
          ...process.env,
          PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'dev-secret-for-playwright-tests-only',
        },
      },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})


