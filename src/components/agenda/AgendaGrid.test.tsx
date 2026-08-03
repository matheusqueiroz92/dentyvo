import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AgendamentoAgendaDTO } from "@/lib/agenda/types";

import { AgendaGrid } from "./AgendaGrid";

vi.mock("@/hooks/useReagendarAgendamento", () => ({
  useReagendarAgendamento: () => ({
    executarRemarcacao: vi.fn(),
    remarcacaoPendente: () => false,
  }),
}));

vi.mock("./AgendaEventoCard", () => ({
  AgendaEventoCard: () => null,
}));

vi.mock("./AgendaSlotCell", () => ({
  AgendaSlotCell: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="slot">{children}</div>
  ),
}));

const permissoes = {
  marcar: true,
  remarcar: true,
  cancelar: true,
  confirmar: true,
};

const cancelado: AgendamentoAgendaDTO = {
  id: "a-cancelado",
  dataHoraInicioIso: "2026-08-03T13:00:00.000Z",
  dataHoraFimIso: "2026-08-03T13:30:00.000Z",
  pacienteId: "p1",
  pacienteNome: "Ana",
  profissionalId: "d1",
  profissionalNome: "Dr. B",
  procedimentoId: "pr1",
  procedimentoNome: "Consulta",
  status: "cancelado",
  origem: "painel",
  motivoCancelamento: "teste",
};

describe("AgendaGrid — empty state sem consultas ativas", () => {
  it("renderiza dia sem pendente/confirmado sem lançar Invalid time value", () => {
    expect(() =>
      render(
        <AgendaGrid
          modo="dia"
          multiProfissional={false}
          dataReferencia={new Date("2026-08-03T15:00:00.000Z")}
          agendamentos={[]}
          onAgendamentosChange={vi.fn()}
          profissionais={[{ id: "d1", label: "Dr. B" }]}
          permissoes={permissoes}
          onAgendamentoClick={vi.fn()}
        />,
      ),
    ).not.toThrow();

    expect(
      screen.getByText(/Nenhuma consulta no período\. Horários:/),
    ).toBeInTheDocument();
    expect(screen.getByText(/07:00, 07:30, 08:00/)).toBeInTheDocument();
  });

  it("trata só cancelados como empty state (sem formatar HH:mm via formatarHora)", () => {
    expect(() =>
      render(
        <AgendaGrid
          modo="dia"
          multiProfissional={false}
          compacto
          dataReferencia={new Date("2026-08-03T15:00:00.000Z")}
          agendamentos={[cancelado]}
          onAgendamentosChange={vi.fn()}
          profissionais={[{ id: "d1", label: "Dr. B" }]}
          permissoes={permissoes}
          onAgendamentoClick={vi.fn()}
        />,
      ),
    ).not.toThrow();

    expect(
      screen.getByText(/Nenhuma consulta no período\. Horários:/),
    ).toBeInTheDocument();
  });
});
