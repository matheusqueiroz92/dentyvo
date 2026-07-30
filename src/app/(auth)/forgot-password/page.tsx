import { CardAuth } from "@/components/auth/CardAuth";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { PageAuthContainer } from "@/components/auth/PageAuthContainer";

export const metadata = {
  title: "Esqueci a senha — Dentyvo",
  description: "Solicite um link para redefinir sua senha.",
};

export default function ForgotPasswordPage() {
  return (
    <PageAuthContainer>
      <CardAuth
        title="Esqueceu a senha?"
        description={{
          text: "Lembrou a senha?",
          link: { href: "/login", label: "Voltar ao login" },
        }}
        content={<ForgotPasswordForm />}
      />
    </PageAuthContainer>
  );
}
