import { CardAuth } from "@/components/auth/CardAuth";
import { CadastroForm } from "@/components/auth/CadastroForm";
import { PageAuthContainer } from "@/components/auth/PageAuthContainer";

export const metadata = {
  title: "Cadastro — Dentyvo",
  description: "Cadastre sua clínica e comece o trial gratuito.",
};

export default function CadastroPage() {
  return (
    <PageAuthContainer>
      <CardAuth
        title="Cadastre sua clínica"
        description={{
          text: "Já tem conta?",
          link: { href: "/login", label: "Entrar" },
        }}
        content={<CadastroForm />}
      />
    </PageAuthContainer>
  );
}
