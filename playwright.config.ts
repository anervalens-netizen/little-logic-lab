import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/web",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    serviceWorkers: "allow",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npm run build:web && npm run preview --workspace @little-logic-lab/web -- --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    {
      name: "chromium-touch",
      use: {
        ...devices["Pixel 7"],
      },
    },
    {
      name: "webkit-touch",
      use: {
        ...devices["iPad (gen 7)"],
      },
    },
  ],
});
