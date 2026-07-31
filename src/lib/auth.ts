import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { SESSAO_TTL_MS } from "@/core/auth/domain/constants";
import { db } from "@/db";
import * as schema from "@/db/schema";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleHabilitado = Boolean(googleClientId && googleClientSecret);

/**
 * BetterAuth — sessão de 7 dias (spec 001).
 * Multi-tenant/RBAC via Profissional + AuthPort, não via roles nativos aqui.
 *
 * Google OAuth unificado (login + cadastro):
 * - cria usuário se o e-mail ainda não existir;
 * - account linking junta Google à conta e-mail/senha do mesmo e-mail
 *   (`trustedProviders` + `requireLocalEmailVerified: false` enquanto o
 *   signup por senha não verifica e-mail — ver docs Better Auth).
 * Destino pós-callback: `/auth/continuar` (app ou onboarding).
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Stub até o adapter de e-mail de produção (débito 001).
      console.info(
        `[auth] reset de senha para ${user.email}: ${url}`,
      );
    },
  },
  socialProviders: {
    ...(googleHabilitado
      ? {
          google: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
          },
        }
      : {}),
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: googleHabilitado ? ["google"] : [],
      /**
       * Default do Better Auth é `true` e bloqueia linking quando o user
       * local tem `emailVerified: false` (nosso signup por senha). Sem isto,
       * mesmo e-mail + Google não vira a mesma conta.
       * @deprecated na lib — quando o gate virar incondicional, habilitar
       * verificação de e-mail no signup por senha.
       */
      requireLocalEmailVerified: false,
    },
  },
  session: {
    expiresIn: SESSAO_TTL_MS / 1000,
    updateAge: 60 * 60 * 24,
  },
});
