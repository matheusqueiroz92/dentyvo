import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { SESSAO_TTL_MS } from "@/core/auth/domain/constants";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * BetterAuth — sessão de 7 dias (spec 001).
 * Multi-tenant/RBAC via Profissional + AuthPort, não via roles nativos aqui.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: SESSAO_TTL_MS / 1000,
    updateAge: 60 * 60 * 24,
  },
});
