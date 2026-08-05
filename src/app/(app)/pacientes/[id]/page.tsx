import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PacienteDetalheClient } from "@/components/pacientes";
import { Skeleton } from "@/components/ui/skeleton";
import { carregarContextoApp } from "@/lib/layout/carregar-contexto-app";
import { carregarPacientePorId } from "@/lib/pacientes/carregar-pacientes";

export const metadata = {
  title: "Paciente — Dentyvo",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

async function PacienteDetalheConteudo({ id }: { id: string }) {
  const [paciente, contexto] = await Promise.all([
    carregarPacientePorId(id),
    carregarContextoApp(),
  ]);
  if (!paciente) {
    notFound();
  }
  return (
    <PacienteDetalheClient paciente={paciente} papel={contexto.usuario.papel} />
  );
}

export default async function PacienteDetalhePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <PacienteDetalheConteudo id={id} />
    </Suspense>
  );
}
