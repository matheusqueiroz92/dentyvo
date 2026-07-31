import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, like, desc } from "drizzle-orm";
import { Pool } from "pg";

import * as schema from "../../src/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL_E2E;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL_E2E não definida. Use uma branch Neon de teste (nunca o banco de desenvolvimento).",
  );
}

const pool = new Pool({ connectionString });
export const e2eDb = drizzle(pool, { schema });

export async function buscarAssinaturaPorDocumento(documento: string) {
  const clinica = await e2eDb.query.clinica.findFirst({
    where: eq(schema.clinica.documento, documento.replace(/\D/g, "")),
  });
  if (!clinica) return null;

  return e2eDb.query.assinatura.findFirst({
    where: eq(schema.assinatura.clinicaId, clinica.id),
  });
}

export async function buscarTokenResetSenhaPorEmail(
  email: string,
): Promise<string | null> {
  const user = await e2eDb.query.user.findFirst({
    where: eq(schema.user.email, email.trim().toLowerCase()),
  });
  if (!user) return null;

  const rows = await e2eDb
    .select()
    .from(schema.verification)
    .where(like(schema.verification.identifier, "reset-password:%"))
    .orderBy(desc(schema.verification.createdAt))
    .limit(20);

  const row = rows.find((r) => r.value === user.id);
  if (!row) return null;

  const prefix = "reset-password:";
  if (!row.identifier.startsWith(prefix)) return null;
  return row.identifier.slice(prefix.length);
}

export async function fecharPoolE2e() {
  await pool.end();
}
