"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useMemo } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { useReagendarAgendamento } from "@/hooks/useReagendarAgendamento";
import { agendaKeyboardCoordinateGetter } from "@/lib/agenda/keyboard-coordinates";
import {
  alinharAoSlot,
  chaveSlot,
  diasNoPeriodo,
  formatarDataCurta,
  instanteSlot,
  parseChaveSlot,
  periodoParaModo,
  slotsDoDia,
} from "@/lib/agenda/periodo";
import type {
  AgendaModo,
  AgendaPermissoes,
  AgendamentoAgendaDTO,
} from "@/lib/agenda/types";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

import { AgendaEventoCard } from "./AgendaEventoCard";
import { AgendaSlotCell } from "./AgendaSlotCell";

export type AgendaGridProps = {
  modo: AgendaModo;
  multiProfissional: boolean;
  compacto?: boolean;
  dataReferencia: Date;
  agendamentos: AgendamentoAgendaDTO[];
  onAgendamentosChange: (lista: AgendamentoAgendaDTO[]) => void;
  profissionais: { id: string; label: string }[];
  /** No compacto, filtra a um profissional ou mostra todos numa coluna. */
  profissionalFiltroId?: string | "todos";
  permissoes: AgendaPermissoes;
  onSlotVazio?: (input: {
    profissionalId: string;
    dataHoraInicioIso: string;
  }) => void;
  onAgendamentoClick: (agendamento: AgendamentoAgendaDTO) => void;
  className?: string;
};

function ocupaSlot(
  a: AgendamentoAgendaDTO,
): a is AgendamentoAgendaDTO & { status: "pendente" | "confirmado" } {
  return a.status === "pendente" || a.status === "confirmado";
}

export function AgendaGrid({
  modo,
  multiProfissional,
  compacto = false,
  dataReferencia,
  agendamentos,
  onAgendamentosChange,
  profissionais,
  profissionalFiltroId = "todos",
  permissoes,
  onSlotVazio,
  onAgendamentoClick,
  className,
}: AgendaGridProps) {
  const { executarRemarcacao, remarcacaoPendente } = useReagendarAgendamento({
    agendamentos,
    onChange: onAgendamentosChange,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: agendaKeyboardCoordinateGetter,
    }),
  );

  const { dataInicio, dataFim } = useMemo(
    () => periodoParaModo(modo, dataReferencia),
    [modo, dataReferencia],
  );

  const dias = useMemo(
    () => diasNoPeriodo(dataInicio, dataFim),
    [dataInicio, dataFim],
  );

  const slots = useMemo(() => slotsDoDia(), []);

  const colunasProf = useMemo(() => {
    if (compacto && profissionalFiltroId === "todos") {
      return [{ id: "__todos__", label: "Todos" }];
    }
    if (!multiProfissional || profissionalFiltroId !== "todos") {
      const id =
        profissionalFiltroId === "todos"
          ? profissionais[0]?.id
          : profissionalFiltroId;
      const found = profissionais.find((p) => p.id === id);
      return found ? [found] : profissionais.slice(0, 1);
    }
    return profissionais;
  }, [compacto, multiProfissional, profissionalFiltroId, profissionais]);

  const diasExibidos = compacto || modo === "dia" ? dias.slice(0, 1) : dias;

  const eventosPorSlot = useMemo(() => {
    const map = new Map<string, AgendamentoAgendaDTO[]>();
    for (const a of agendamentos) {
      if (!ocupaSlot(a)) continue;
      const inicioAlinhado = alinharAoSlot(a.dataHoraInicioIso);
      const profKey =
        compacto && profissionalFiltroId === "todos"
          ? "__todos__"
          : a.profissionalId;
      const key = chaveSlot(profKey, inicioAlinhado);
      const lista = map.get(key) ?? [];
      lista.push(a);
      map.set(key, lista);
    }
    return map;
  }, [agendamentos, compacto, profissionalFiltroId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !permissoes.remarcar) return;

    const agendamentoId = String(active.id);
    const { inicioIso } = parseChaveSlot(String(over.id));
    void executarRemarcacao(agendamentoId, inicioIso).finally(() => {
      // Restaura foco no card remarcado (teclado/dnd-kit tende a soltar no body).
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(
          `[data-agendamento-id="${agendamentoId}"]`,
        );
        el?.focus();
      });
    });
  }

  if (profissionais.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nenhum profissional cadastrado"
        description="Cadastre profissionais para visualizar a agenda."
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "overflow-auto rounded-lg border border-border bg-card",
          className,
        )}
      >
        <div
          className="grid min-w-max"
          style={{
            gridTemplateColumns: `72px repeat(${colunasProf.length * diasExibidos.length}, minmax(${compacto ? "120px" : "160px"}, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-10 border-b border-r border-border bg-muted/40 p-2 text-xs font-medium text-muted-foreground">
            Horário
          </div>
          {diasExibidos.map((dia) =>
            colunasProf.map((prof) => (
              <div
                key={`${dia.toISOString()}-${prof.id}`}
                className="border-b border-r border-border bg-muted/40 p-2 text-center"
              >
                <p className="text-xs font-semibold text-foreground">
                  {formatarDataCurta(dia)}
                </p>
                {!compacto || profissionalFiltroId !== "todos" ? (
                  <p className="truncate text-[11px] text-muted-foreground">
                    {prof.label}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Equipe
                  </p>
                )}
              </div>
            )),
          )}

          {slots.map((hora) => (
            <div key={hora} className="contents">
              <div className="sticky left-0 z-10 flex items-start justify-end border-b border-r border-border bg-muted/20 px-2 py-1 text-xs tabular-nums text-muted-foreground">
                {hora}
              </div>
              {diasExibidos.map((dia) =>
                colunasProf.map((prof) => {
                  const inicio = instanteSlot(dia, hora);
                  const inicioIso = inicio.toISOString();
                  const slotId = chaveSlot(prof.id, inicioIso);
                  const eventos = eventosPorSlot.get(slotId) ?? [];

                  return (
                    <AgendaSlotCell
                      key={slotId}
                      id={slotId}
                      compacto={compacto}
                      onClickVazio={
                        permissoes.marcar && onSlotVazio
                          ? () =>
                              onSlotVazio({
                                profissionalId:
                                  prof.id === "__todos__"
                                    ? (profissionais[0]?.id ?? "")
                                    : prof.id,
                                dataHoraInicioIso: inicioIso,
                              })
                          : undefined
                      }
                    >
                      {eventos.map((a) => (
                        <AgendaEventoCard
                          key={a.id}
                          agendamento={a}
                          compacto={compacto}
                          arrastavel={
                            permissoes.remarcar &&
                            (a.status === "pendente" ||
                              a.status === "confirmado")
                          }
                          pendente={remarcacaoPendente(a.id)}
                          onClick={() => onAgendamentoClick(a)}
                        />
                      ))}
                    </AgendaSlotCell>
                  );
                }),
              )}
            </div>
          ))}
        </div>
      </div>
      {agendamentos.filter(ocupaSlot).length === 0 ? (
        <p className="sr-only">
          Nenhuma consulta no período. Horários:{" "}
          {slots.slice(0, 3).join(", ")}…
        </p>
      ) : null}
    </DndContext>
  );
}
