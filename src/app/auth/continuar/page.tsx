import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA } from "@/lib/auth-destino";
import { resolverDestinoAuth } from "@/lib/auth-destino.server";
import { auth } from "@/lib/auth";

/**
 * Pós-callback OAuth: resolve destino por tipo ou devolve ao login com erro.
 */
export default async function AuthContinuarPage() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao?.user) {
    redirect(
      `/login?erro=conta-nao-encontrada&motivo=${encodeURIComponent(MENSAGEM_CONTA_SOCIAL_NAO_ENCONTRADA)}`,
    );
  }

  const destino = await resolverDestinoAuth({
    usuarioId: sessao.user.id,
    email: sessao.user.email,
  });

  if (!destino) {
    await auth.api.signOut({ headers: await headers() });
    redirect("/login?erro=conta-nao-encontrada");
  }

  redirect(destino);
}
