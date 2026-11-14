import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.mjs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4200', trace: 'retain-on-failure' },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
});
