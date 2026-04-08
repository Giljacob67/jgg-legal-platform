import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    env: {
      ...process.env,
      DATA_MODE: "mock",
      MOCK_DEFAULT_PASSWORD: process.env.E2E_LOGIN_PASSWORD ?? "dev-only-change-me",
      MOCK_USERS_JSON: JSON.stringify([
        {
          id: "usr-adv-001",
          email: process.env.E2E_LOGIN_EMAIL ?? "mariana@jgg.com.br",
          password: process.env.E2E_LOGIN_PASSWORD ?? "dev-only-change-me",
          name: "Mariana Couto",
          initials: "MC",
          role: "advogado",
        },
      ]),
      AUTH_SECRET: process.env.AUTH_SECRET ?? "playwright-dev-secret",
    },
  },
});
