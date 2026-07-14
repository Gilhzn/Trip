import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:4173',
    // Use the system Chromium when present (e.g. preinstalled CI images)
    // instead of downloading a browser.
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {}),
  },
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});
