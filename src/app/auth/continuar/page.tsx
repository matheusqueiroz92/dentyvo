import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { resolverDestinoPosCallbackSocial } from "@/lib/auth-destino";
import { resolverDestinoAuth } from "@/lib/auth-destino.server";
import { auth } from "@/lib/auth";

/**
 * Pós-callback OAuth unificado:
 * conta completa → /dashboard|/admin; sem clínica → onboarding /cadastro.
 */
export default async function AuthContinuarPage() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  const destinoApp = sessao?.user
    ? await resolverDestinoAuth({
        usuarioId: sessao.user.id,
        email: sessao.user.email,
      })
    : null;

  redirect(
    resolverDestinoPosCallbackSocial({
      temSessao: Boolean(sessao?.user),
      destinoApp,
    }),
  );
}
