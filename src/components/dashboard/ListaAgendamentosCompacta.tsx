import { StatusAgendamentoBadge } from "@/components/domain/StatusAgendamentoBadge";
import type { AgendamentoDashboardDTO } from "@/lib/dashboard/types";

import { formatarHorario } from "./formatacao";

export function ListaAgendamentosCompacta({
  itens,
}: {
  itens: AgendamentoDashboardDTO[];
}) {
  return (
    <ul className="divide-y divide-border" role="list">
      {itens.map((item) => (
        <li
          key={item.id}
          className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0"
        >
          <time
            dateTime={item.dataHoraInicioIso}
            className="w-12 shrink-0 font-medium tabular-nums text-foreground"
          >
            {formatarHorario(item.dataHoraInicioIso)}
          </time>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {item.pacienteNome}
            </p>
            <p className="truncate text-[13px] leading-5 text-muted-foreground">
              {item.profissionalNome}
            </p>
          </div>
          <StatusAgendamentoBadge status={item.status} />
        </li>
      ))}
    </ul>
  );
}
