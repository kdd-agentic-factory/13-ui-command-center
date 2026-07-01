import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.KDD_PRODUCTION_BASE_URL ?? 'https://kdd-agentic-factory.insforge.site';

export default defineConfig({
  testDir: './tests/e2e/production-site',
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-production',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
