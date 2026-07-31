import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { concluirCadastroAction } from "@/actions/concluir-cadastro";
import { SignupClinicaForm } from "@/components/auth/SignupClinicaForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Dados da clínica — Cadastro — Dentyvo",
  description: "Complete o cadastro com os dados da sua clínica.",
};

/**
 * Etapa 2 do cadastro — layout próprio, mais amplo (logo + tema).
 *
 * TODO(cadastro-abandonado): sem rascunho da etapa 1 (sessionStorage), o form
 * redireciona para `/cadastro`. Não há recuperação de fluxo abandonado.
 */
export default function SignupClinicaPage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <Link
            href="/cadastro"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Voltar aos dados pessoais
          </Link>
        </div>

        <Card className="shadow-[var(--shadow-md)]">
          <CardHeader>
            <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">
              Etapa 2 de 2
            </p>
            <CardTitle className="text-xl">Dados da clínica</CardTitle>
            <CardDescription>
              Informe os dados da clínica, logo e tema. Ao concluir, você
              entra no painel com o trial iniciado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupClinicaForm concluirCadastro={concluirCadastroAction} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
