"use server";

import { headers } from "next/headers";

import { MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA, type DestinoAuth } from "@/lib/auth-destino";
import { resolverDestinoAuth } from "@/lib/auth-destino.server";
import { auth } from "@/lib/auth";

export type ObterDestinoPosLoginResult =
  | { ok: true; destino: DestinoAuth }
  | { ok: false; mensagem: string };

/**
 * Após login (email/senha ou social), resolve /dashboard vs /admin.
 * Sem vínculo Profissional/UsuarioPlataforma → erro amigável.
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
    await auth.api.signOut({ headers: await headers() });
    return {
      ok: false,
      mensagem: MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA,
    };
  }

  return { ok: true, destino };
}
