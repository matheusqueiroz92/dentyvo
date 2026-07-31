import { CardAuth } from "@/components/auth/CardAuth";
import { SignupForm } from "@/components/auth/SignupForm";
import { PageAuthContainer } from "@/components/auth/PageAuthContainer";
import { resolverPlanoDaQuery } from "@/lib/cadastro/planos";

export const metadata = {
  title: "Cadastro — Dentyvo",
  description: "Crie sua conta, escolha o plano e cadastre sua clínica.",
};

type SignupPageProps = {
  searchParams: Promise<{ plano?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const planoInicial = resolverPlanoDaQuery(params.plano);

  return (
    <PageAuthContainer width="wide">
      <CardAuth
        title="Comece seu trial gratuito"
        description={{
          text: "Já tem uma conta?",
          link: { href: "/login", label: "Faça o login" },
        }}
        content={<SignupForm planoInicial={planoInicial} />}
      />
    </PageAuthContainer>
  );
}
