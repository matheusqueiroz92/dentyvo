import { Suspense } from "react";

import { PacientesPageClient } from "@/components/pacientes";
import { Skeleton } from "@/components/ui/skeleton";
import { carregarListaPacientes } from "@/lib/pacientes/carregar-pacientes";

export const metadata = {
  title: "Pacientes — Dentyvo",
};

async function PacientesConteudo() {
  const pacientes = await carregarListaPacientes();
  return <PacientesPageClient iniciais={pacientes} />;
}

export default function PacientesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <PacientesConteudo />
    </Suspense>
  );
}
