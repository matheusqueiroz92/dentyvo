import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { CardAuth } from "@/components/auth/CardAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageAuthContainer } from "@/components/auth/PageAuthContainer";
import { resolverDestinoPosCallbackSocial } from "@/lib/auth-destino";
import { resolverDestinoAuth } from "@/lib/auth-destino.server";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Entrar — Dentyvo",
  description: "Acesse a Dentyvo com e-mail e senha ou Google.",
};

export default async function LoginPage() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (sessao?.user) {
    const destinoApp = await resolverDestinoAuth({
      usuarioId: sessao.user.id,
      email: sessao.user.email,
    });
    redirect(
      resolverDestinoPosCallbackSocial({
        temSessao: true,
        destinoApp,
      }),
    );
  }

  return (
    <PageAuthContainer>
      <CardAuth
        title="Bem-vindo(a) de volta"
        description={{
          text: "Ainda não tem conta?",
          link: { href: "/cadastro", label: "Cadastre sua clínica" },
        }}
        content={
          <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
            <LoginForm />
          </Suspense>
        }
      />
    </PageAuthContainer>
  );
}
