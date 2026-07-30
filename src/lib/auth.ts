import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { SESSAO_TTL_MS } from "@/core/auth/domain/constants";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { usuarioTemVinculoAutorizado } from "@/lib/auth-destino.server";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleHabilitado = Boolean(googleClientId && googleClientSecret);

/**
 * BetterAuth — sessão de 7 dias (spec 001).
 * Multi-tenant/RBAC via Profissional + AuthPort, não via roles nativos aqui.
 *
 * Google OAuth: `disableSignUp` impede criação implícita de usuário.
 * `session.create.before` rejeita sessão se não houver Profissional nem
 * UsuarioPlataforma (evita conta órfã sem clínica/plataforma).
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
            /** Não cria Clinica/Profissional nem user órfão via Google. */
            disableSignUp: true,
          },
        }
      : {}),
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: googleHabilitado ? ["google"] : [],
    },
  },
  session: {
    expiresIn: SESSAO_TTL_MS / 1000,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    session: {
      create: {
        /**
         * Só no fluxo social: rejeita sessão sem Profissional/UsuarioPlataforma.
         * Não aplicar em `/sign-up/email` — o cadastro grava o Profissional
         * depois de `criarUsuario` (que pode criar sessão).
         */
        before: async (session, ctx) => {
          const path = typeof ctx?.path === "string" ? ctx.path : "";
          const isSocialCallback =
            path.includes("/callback/") || path.includes("/sign-in/social");
          if (!isSocialCallback) {
            return { data: session };
          }

          const autorizado = await usuarioTemVinculoAutorizado(session.userId);
          if (!autorizado) {
            return false;
          }
          return { data: session };
        },
      },
    },
  },
});
