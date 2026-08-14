"use client";

import Link from "next/link";
import { ClipboardPlus } from "lucide-react";

import { PacientesTable } from "@/components/pacientes/PacientesTable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { PacienteDTO } from "@/lib/pacientes/types";
import { caminhoProntuarioDoPaciente } from "@/lib/prontuario/navegacao";

type ProntuariosPageClientProps = {
  iniciais: PacienteDTO[];
};

export function ProntuariosPageClient({
  iniciais,
}: ProntuariosPageClientProps) {
  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl leading-[38px] font-bold tracking-tight text-foreground">
          Prontuários
        </h1>
        <p className="mt-1 text-sm leading-[22px] text-muted-foreground">
          Selecione um paciente para abrir o prontuário clínico.
        </p>
      </header>

      {iniciais.length === 0 ? (
        <EmptyState
          icon={ClipboardPlus}
          title="Nenhum paciente cadastrado"
          description="Cadastre um paciente para abrir o prontuário clínico."
          action={
            <Button asChild variant="primary" className="min-h-11">
              <Link href="/pacientes">Ir para pacientes</Link>
            </Button>
          }
        />
      ) : (
        <PacientesTable
          pacientes={iniciais}
          caminhoDoPaciente={caminhoProntuarioDoPaciente}
          rotuloAcao="Abrir prontuário"
        />
      )}
    </main>
  );
}
