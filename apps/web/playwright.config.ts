import { defineConfig, devices } from "@playwright/test";

const localBaseUrl = "http://127.0.0.1:3100";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || localBaseUrl;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
          url: localBaseUrl,
          reuseExistingServer: false,
          timeout: 120_000,
        },
      }),
});
