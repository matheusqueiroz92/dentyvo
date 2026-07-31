import { CalendarDays } from "lucide-react";

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

export function AgendaDoDiaCard({
  resultado,
}: {
  resultado: ResultadoBloco<AgendamentoDashboardDTO[]>;
}) {
  if (!resultado.ok) {
    return <BlocoErro title="Agenda do dia" mensagem={resultado.mensagem} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Agenda do dia</CardTitle>
        <CardDescription>
          Consultas de hoje, ordenadas por horário.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resultado.data.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhuma consulta hoje. Crie um agendamento ou altere os filtros."
          />
        ) : (
          <ListaAgendamentosCompacta itens={resultado.data} />
        )}
      </CardContent>
    </Card>
  );
}
