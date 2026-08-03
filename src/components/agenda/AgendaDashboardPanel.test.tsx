import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgendaDashboardPanel } from "./AgendaDashboardPanel";

vi.mock("@/hooks/useReagendarAgendamento", () => ({
  useReagendarAgendamento: () => ({
    executarRemarcacao: vi.fn(),
    remarcacaoPendente: () => false,
  }),
}));

vi.mock("./NovoAgendamentoModal", () => ({
  NovoAgendamentoModal: () => null,
}));

vi.mock("./DetalhesAgendamentoModal", () => ({
  DetalhesAgendamentoModal: () => null,
}));

vi.mock("./AgendaSlotCell", () => ({
  AgendaSlotCell: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="slot">{children}</div>
  ),
}));

vi.mock("./AgendaEventoCard", () => ({
  AgendaEventoCard: () => null,
}));

describe("AgendaDashboardPanel — dia sem agendamentos", () => {
  it("renderiza empty state do grid sem Invalid time value", () => {
    expect(() =>
      render(
        <AgendaDashboardPanel
          iniciais={[]}
          profissionais={[{ id: "d1", label: "Dr. B" }]}
          pacientes={[]}
          procedimentos={[]}
          permissoes={{
            marcar: true,
            remarcar: true,
            cancelar: true,
            confirmar: true,
          }}
          profissionalIdSessao="d1"
        />,
      ),
    ).not.toThrow();

    expect(screen.getByText("Agenda do dia")).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhuma consulta no período\. Horários:/),
    ).toBeInTheDocument();
    expect(screen.getByText(/07:00, 07:30, 08:00/)).toBeInTheDocument();
  });
});
