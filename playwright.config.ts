import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/web",
  fullyParallel: true,
  timeout: 60_000,
  // Pixi/WebGL scenes share the host GPU; serial workers keep the release gate
  // deterministic instead of measuring renderer contention between tests.
  workers: 1,
  retries: 0,
  reporter: "line",
  expect: {
    timeout: 35_000,
  },
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
    timeout: 60_000,
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
