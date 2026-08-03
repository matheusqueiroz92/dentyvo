import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PacienteNaoEncontrado() {
  return (
    <main className="flex flex-col items-start gap-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Paciente não encontrado
      </h1>
      <p className="text-sm text-muted-foreground">
        Este paciente não existe nesta clínica ou foi removido.
      </p>
      <Button asChild variant="outline" className="min-h-11">
        <Link href="/pacientes">Voltar para pacientes</Link>
      </Button>
    </main>
  );
}
