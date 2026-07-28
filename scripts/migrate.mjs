/**
 * Aplica migrations Drizzle no banco real.
 *
 * Por que não usar `drizzle-kit migrate` diretamente:
 * - Em alguns ambientes (Neon/pooler, Windows, SSL) o CLI falha ou usa
 *   a connection string errada (`DATABASE_URL` vs `DATABASE_URL_MIGRATIONS`).
 * - Este script usa `drizzle-orm` migrator + `DATABASE_URL_MIGRATIONS`
 *   (conexão direta, sem pooler), com logs explícitos de sucesso/erro.
 *
 * Uso: `node scripts/migrate.mjs`
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL_MIGRATIONS;
if (!connectionString) {
  console.error(
    "DATABASE_URL_MIGRATIONS não definida em .env.local — abortando.",
  );
  process.exit(1);
}

const client = new Client({ connectionString });

async function main() {
  console.log("Conectando (DATABASE_URL_MIGRATIONS)...");
  await client.connect();
  console.log("Conectado. Aplicando migrations em src/db/migrations...");

  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: "src/db/migrations" });
    console.log("Migrations aplicadas com sucesso.");
  } catch (err) {
    console.error("ERRO NA MIGRATION:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
