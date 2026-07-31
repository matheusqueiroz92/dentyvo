import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const e2eDatabaseUrl = process.env.DATABASE_URL_E2E?.trim();
if (!e2eDatabaseUrl) {
  throw new Error(
    "DATABASE_URL_E2E não configurada. Defina em .env.local uma branch Neon de teste — nunca use o mesmo valor de DATABASE_URL (banco de desenvolvimento).",
  );
}

const databaseUrlDev = process.env.DATABASE_URL?.trim();
if (databaseUrlDev && e2eDatabaseUrl === databaseUrlDev) {
  throw new Error(
    "DATABASE_URL_E2E não pode ser igual a DATABASE_URL. Use uma branch Neon de teste separada do banco de desenvolvimento.",
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
      // Força o app a usar só o banco E2E (sem fallback para DATABASE_URL de dev).
      DATABASE_URL: e2eDatabaseUrl,
      BETTER_AUTH_URL: baseURL,
    },
  },
});
