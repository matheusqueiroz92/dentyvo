import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AgendamentoAgendaDTO } from "@/lib/agenda/types";

import { useReagendarAgendamento } from "./useReagendarAgendamento";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { toast } from "sonner";

function dto(
  partial: Partial<AgendamentoAgendaDTO> & { id: string },
): AgendamentoAgendaDTO {
  return {
    dataHoraInicioIso: "2026-08-03T12:00:00.000Z",
    dataHoraFimIso: "2026-08-03T12:30:00.000Z",
    pacienteId: "p1",
    pacienteNome: "Ana",
    profissionalId: "d1",
    profissionalNome: "Dr. B",
    procedimentoId: "pr1",
    procedimentoNome: "Consulta",
    status: "pendente",
    origem: "painel",
    motivoCancelamento: null,
    ...partial,
  };
}

describe("useReagendarAgendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aplica otimista e confirma no sucesso", async () => {
    let lista = [dto({ id: "a1" })];
    const onChange = vi.fn((prox: AgendamentoAgendaDTO[]) => {
      lista = prox;
    });
    const novaIso = "2026-08-03T14:00:00.000Z";
    const remarcar = vi.fn(async () => ({
      data: dto({
        id: "a1",
        dataHoraInicioIso: novaIso,
        dataHoraFimIso: "2026-08-03T14:30:00.000Z",
      }),
    }));

    const { result, rerender } = renderHook(() =>
      useReagendarAgendamento({
        agendamentos: lista,
        onChange,
        remarcar,
      }),
    );

    await act(async () => {
      await result.current.executarRemarcacao("a1", novaIso);
    });
    rerender();

    expect(remarcar).toHaveBeenCalledWith({
      agendamentoId: "a1",
      novaDataHoraInicioIso: novaIso,
    });
    expect(onChange).toHaveBeenCalled();
    expect(lista[0]?.dataHoraInicioIso).toBe(novaIso);
    expect(toast.success).toHaveBeenCalled();
  });

  it("faz rollback e toast de erro quando o horário está ocupado", async () => {
    const original = dto({ id: "a1" });
    let lista = [original];
    const onChange = vi.fn((prox: AgendamentoAgendaDTO[]) => {
      lista = prox;
    });
    const remarcar = vi.fn(async () => ({
      serverError: {
        codigo: "SobreposicaoHorarioError",
        mensagem: "Horário já ocupado por outra consulta.",
      },
    }));

    const { result } = renderHook(() =>
      useReagendarAgendamento({
        agendamentos: lista,
        onChange,
        remarcar,
      }),
    );

    await act(async () => {
      await result.current.executarRemarcacao(
        "a1",
        "2026-08-03T15:00:00.000Z",
      );
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Horário já ocupado por outra consulta.",
      );
    });

    const ultimo = onChange.mock.calls.at(-1)?.[0] as AgendamentoAgendaDTO[];
    expect(ultimo[0]?.dataHoraInicioIso).toBe(original.dataHoraInicioIso);
  });
});
