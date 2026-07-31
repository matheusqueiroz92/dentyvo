import { Suspense } from "react";

import { CardAuth } from "@/components/auth/CardAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageAuthContainer } from "@/components/auth/PageAuthContainer";

export const metadata = {
  title: "Entrar — Dentyvo",
  description: "Acesse a Dentyvo com e-mail e senha ou Google.",
};

export default function LoginPage() {
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
