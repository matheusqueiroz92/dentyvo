"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { StatusAgendamentoBadge } from "@/components/domain/StatusAgendamentoBadge";
import {
  formatarHora,
} from "@/lib/agenda/periodo";
import type { AgendamentoAgendaDTO } from "@/lib/agenda/types";
import { cn } from "@/lib/utils";

type AgendaEventoCardProps = {
  agendamento: AgendamentoAgendaDTO;
  compacto?: boolean;
  arrastavel: boolean;
  pendente?: boolean;
  onClick: () => void;
};

export function AgendaEventoCard({
  agendamento,
  compacto = false,
  arrastavel,
  pendente,
  onClick,
}: AgendaEventoCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: agendamento.id,
      disabled: !arrastavel,
      data: { agendamento },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        // Evita abrir detalhes após um drag (PointerSensor com distance).
        if (isDragging) return;
        onClick();
      }}
      className={cn(
        "w-full rounded-md border border-border bg-card text-left shadow-(--shadow-sm) transition-opacity",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compacto ? "space-y-0.5 p-1.5 text-xs" : "space-y-1 p-2 text-sm",
        isDragging && "z-20 opacity-80",
        pendente && "opacity-60",
        arrastavel ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      data-agendamento-id={agendamento.id}
      aria-label={`Consulta de ${agendamento.pacienteNome} às ${formatarHora(agendamento.dataHoraInicioIso)}`}
    >
      <p className="font-medium tabular-nums text-foreground">
        {formatarHora(agendamento.dataHoraInicioIso)}
        {!compacto ? (
          <span className="text-muted-foreground">
            {" "}
            – {formatarHora(agendamento.dataHoraFimIso)}
          </span>
        ) : null}
      </p>
      <p className="truncate font-medium text-foreground">
        {agendamento.pacienteNome}
      </p>
      {!compacto ? (
        <p className="truncate text-muted-foreground">
          {agendamento.procedimentoNome}
        </p>
      ) : null}
      {!compacto ? (
        <p className="truncate text-xs text-muted-foreground">
          {agendamento.profissionalNome}
        </p>
      ) : null}
      <StatusAgendamentoBadge
        status={agendamento.status}
        className={compacto ? "scale-90 origin-left" : undefined}
      />
    </button>
  );
}
