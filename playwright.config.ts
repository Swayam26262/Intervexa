import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a production build. They need MongoDB (MONGODB_URI) and run with
 * billing enforcement on and simulated payments so paywalls and purchases are exercised.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/intervexa-e2e",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret-not-for-production-0123456789",
      AUTH_URL: `http://localhost:${PORT}`,
      BILLING_ENABLED: "true",
      PAYMENTS_MODE: "simulate",
      RATE_LIMIT_DISABLED: "true",
      GEMINI_API_KEY: "",
      ANTHROPIC_API_KEY: "",
      OPENAI_API_KEY: "",
    },
  },
});
