import { CardAuth } from "@/components/auth/CardAuth";
import { SignupForm } from "@/components/auth/SignupForm";
import { PageAuthContainer } from "@/components/auth/PageAuthContainer";

export const metadata = {
  title: "Cadastro — Dentyvo",
  description: "Cadastre sua clínica e comece o trial gratuito.",
};

export default function SignupPage() {
  return (
    <PageAuthContainer>
      <CardAuth
        title="Cadastre sua clínica gratuitamente"
        description={{
          text: "Já tem uma conta?",
          link: { href: "/login", label: "Faça o login" },
        }}
        content={<SignupForm />}
      />
    </PageAuthContainer>
  );
}
