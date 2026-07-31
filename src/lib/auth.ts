import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { SESSAO_TTL_MS } from "@/core/auth/domain/constants";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { aplicarPoliticaLinkingSocialAntesDeCriarConta } from "@/lib/auth-linking-risco.server";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleHabilitado = Boolean(googleClientId && googleClientSecret);

/**
 * BetterAuth — sessão de 7 dias (spec 001).
 * Multi-tenant/RBAC via Profissional + AuthPort, não via roles nativos aqui.
 *
 * Google OAuth unificado (login + cadastro).
 *
 * Account linking (Better Auth 1.6.x):
 * - Não há flag nativo condicional por estado da conta — só
 *   `requireLocalEmailVerified` global + `databaseHooks.account.create`.
 * - `requireLocalEmailVerified: false` permite retomar onboarding incompleto
 *   (sem clínica) com o mesmo e-mail.
 * - Em conta COM clínica/plataforma e e-mail local não verificado, o hook
 *   `account.create.before` neutraliza senha credential + revoga sessões
 *   (evita account takeover). Ver `auth-linking-risco.ts`.
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
       * Permissivo globalmente para onboarding incompleto.
       * Contas completas não verificadas são protegidas no hook abaixo.
       * @deprecated na lib — quando o gate virar incondicional, exigir
       * verificação de e-mail no signup por senha.
       */
      requireLocalEmailVerified: false,
    },
  },
  databaseHooks: {
    account: {
      create: {
        before: async (account) => {
          await aplicarPoliticaLinkingSocialAntesDeCriarConta({
            userId: account.userId,
            providerId: account.providerId,
          });
          return { data: account };
        },
      },
    },
  },
  session: {
    expiresIn: SESSAO_TTL_MS / 1000,
    updateAge: 60 * 60 * 24,
  },
});
