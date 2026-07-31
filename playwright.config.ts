import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const e2eDatabaseUrl = process.env.DATABASE_URL_E2E;
if (!e2eDatabaseUrl) {
  console.warn(
    "[playwright] DATABASE_URL_E2E não definida — os testes e2e que consultam o banco falharão.",
  );
}

const port = Number(process.env.E2E_PORT ?? 3100);
// Usar localhost (não 127.0.0.1) — Next.js 16 bloqueia HMR cross-origin por padrão.
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 90_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      // Força o app a usar o banco E2E — nunca o DATABASE_URL de desenvolvimento.
      DATABASE_URL: e2eDatabaseUrl ?? "",
      BETTER_AUTH_URL: baseURL,
    },
  },
});
