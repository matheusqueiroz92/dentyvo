"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { remarcarConsultaAction } from "@/actions/agendamento";
import type { AgendamentoAgendaDTO } from "@/lib/agenda/types";
import type { ServerActionError } from "@/lib/safe-action";

type RemarcarFn = (input: {
  agendamentoId: string;
  novaDataHoraInicioIso: string;
}) => Promise<{
  data?: AgendamentoAgendaDTO;
  serverError?: ServerActionError;
}>;

export type UseReagendarAgendamentoOptions = {
  /** Estado atual dos agendamentos (fonte da verdade otimista). */
  agendamentos: AgendamentoAgendaDTO[];
  onChange: (proximos: AgendamentoAgendaDTO[]) => void;
  /** Injável nos testes; default chama a server action. */
  remarcar?: RemarcarFn;
};

/**
 * Drag-and-drop otimista de remarcação + rollback em erro.
 * Compartilhado entre /agenda e o grid compacto do dashboard.
 */
export function useReagendarAgendamento({
  agendamentos,
  onChange,
  remarcar,
}: UseReagendarAgendamentoOptions) {
  const [pendentes, setPendentes] = useState<Set<string>>(new Set());
  const snapshotRef = useRef<AgendamentoAgendaDTO[] | null>(null);

  const executarRemarcacao = useCallback(
    async (agendamentoId: string, novaDataHoraInicioIso: string) => {
      const atual = agendamentos.find((a) => a.id === agendamentoId);
      if (!atual) return;

      if (atual.dataHoraInicioIso === novaDataHoraInicioIso) return;

      const duracaoMs =
        new Date(atual.dataHoraFimIso).getTime() -
        new Date(atual.dataHoraInicioIso).getTime();

      snapshotRef.current = agendamentos;
      const otimista: AgendamentoAgendaDTO = {
        ...atual,
        dataHoraInicioIso: novaDataHoraInicioIso,
        dataHoraFimIso: new Date(
          new Date(novaDataHoraInicioIso).getTime() + duracaoMs,
        ).toISOString(),
      };

      onChange(
        agendamentos.map((a) => (a.id === agendamentoId ? otimista : a)),
      );
      setPendentes((prev) => new Set(prev).add(agendamentoId));

      try {
        const fn =
          remarcar ??
          (async (input) => {
            const result = await remarcarConsultaAction(input);
            return {
              data: result.data,
              serverError: result.serverError,
            };
          });

        const result = await fn({
          agendamentoId,
          novaDataHoraInicioIso,
        });

        if (result.serverError || !result.data) {
          onChange(snapshotRef.current ?? agendamentos);
          toast.error(
            result.serverError?.mensagem ??
              "Não foi possível remarcar a consulta.",
          );
          return;
        }

        onChange(
          (snapshotRef.current ?? agendamentos).map((a) =>
            a.id === agendamentoId ? result.data! : a,
          ),
        );
        toast.success("Consulta remarcada.");
      } catch {
        onChange(snapshotRef.current ?? agendamentos);
        toast.error("Não foi possível remarcar a consulta.");
      } finally {
        snapshotRef.current = null;
        setPendentes((prev) => {
          const next = new Set(prev);
          next.delete(agendamentoId);
          return next;
        });
      }
    },
    [agendamentos, onChange, remarcar],
  );

  return {
    executarRemarcacao,
    remarcacaoPendente: (id: string) => pendentes.has(id),
  };
}
