import { CalendarClock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ResultadoBloco, AgendamentoDashboardDTO } from "@/lib/dashboard/types";

import { BlocoErro } from "./BlocoErro";
import { ListaAgendamentosCompacta } from "./ListaAgendamentosCompacta";

export function ConfirmacoesPendentesCard({
  resultado,
}: {
  resultado: ResultadoBloco<AgendamentoDashboardDTO[]>;
}) {
  if (!resultado.ok) {
    return (
      <BlocoErro title="Confirmações pendentes" mensagem={resultado.mensagem} />
    );
  }

  const pendentes = resultado.data.filter((a) => a.status === "pendente");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Confirmações pendentes</CardTitle>
        <CardDescription>
          Aguardando confirmação do paciente ou da recepção.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendentes.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Nenhuma confirmação pendente."
            description="Consultas aguardando confirmação aparecem aqui."
          />
        ) : (
          <ListaAgendamentosCompacta itens={pendentes} />
        )}
      </CardContent>
    </Card>
  );
}
