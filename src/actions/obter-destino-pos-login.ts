"use server";

import { headers } from "next/headers";

import type { DestinoAuth } from "@/lib/auth-destino";
import { resolverDestinoAuth } from "@/lib/auth-destino.server";
import { auth } from "@/lib/auth";

export type DestinoPosLogin = DestinoAuth | "/cadastro";

export type ObterDestinoPosLoginResult =
  | { ok: true; destino: DestinoPosLogin }
  | { ok: false; mensagem: string };

/**
 * Após login (email/senha ou social), resolve destino:
 * /dashboard | /admin | /cadastro (onboarding incompleto).
 */
export async function obterDestinoPosLogin(): Promise<ObterDestinoPosLoginResult> {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user) {
    return {
      ok: false,
      mensagem: "Sessão inválida. Faça login novamente.",
    };
  }

  const destino = await resolverDestinoAuth({
    usuarioId: sessao.user.id,
    email: sessao.user.email,
  });

  if (!destino) {
    return { ok: true, destino: "/cadastro" };
  }

  return { ok: true, destino };
}
