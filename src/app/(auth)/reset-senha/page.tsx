import { Suspense } from "react";

import { CardAuth } from "@/components/auth/CardAuth";
import { PageAuthContainer } from "@/components/auth/PageAuthContainer";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Redefinir senha — Dentyvo",
  description: "Defina uma nova senha para acessar a Dentyvo.",
};

export default function ResetPasswordPage() {
  return (
    <PageAuthContainer>
      <CardAuth
        title="Redefinir senha"
        description={{
          text: "Escolha uma nova senha para a sua conta.",
        }}
        content={
          <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
            <ResetPasswordForm />
          </Suspense>
        }
      />
    </PageAuthContainer>
  );
}
