import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AgendamentoAgendaDTO } from "@/lib/agenda/types";

import { DetalhesAgendamentoModal } from "./DetalhesAgendamentoModal";

vi.mock("@/actions/agendamento", () => ({
  cancelarConsultaAction: vi.fn(),
  confirmarConsultaAction: vi.fn(),
  remarcarConsultaAction: vi.fn(),
}));

const agendamento: AgendamentoAgendaDTO = {
  id: "a1",
  dataHoraInicioIso: "2026-08-03T13:00:00.000Z",
  dataHoraFimIso: "2026-08-03T13:30:00.000Z",
  pacienteId: "p1",
  pacienteNome: "Ana",
  profissionalId: "d1",
  profissionalNome: "Dr. B",
  procedimentoId: "pr1",
  procedimentoNome: "Consulta",
  status: "pendente",
  origem: "painel",
  motivoCancelamento: null,
};

describe("DetalhesAgendamentoModal — RBAC visual", () => {
  it("oculta ações quando permissões são false", () => {
    render(
      <DetalhesAgendamentoModal
        agendamento={agendamento}
        open
        onOpenChange={vi.fn()}
        permissoes={{
          marcar: false,
          remarcar: false,
          cancelar: false,
          confirmar: false,
        }}
        onAtualizado={vi.fn()}
        onRemovido={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Confirmar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remarcar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancelar consulta" }),
    ).not.toBeInTheDocument();
  });

  it("mostra Confirmar/Remarcar/Cancelar quando permitido", () => {
    render(
      <DetalhesAgendamentoModal
        agendamento={agendamento}
        open
        onOpenChange={vi.fn()}
        permissoes={{
          marcar: true,
          remarcar: true,
          cancelar: true,
          confirmar: true,
        }}
        onAtualizado={vi.fn()}
        onRemovido={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Confirmar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remarcar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar consulta" }),
    ).toBeInTheDocument();
  });
});
