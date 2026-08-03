import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const listar = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("aba=quadro"),
}));

vi.mock("@/actions/agendamento", () => ({
  listarAgendamentosPeriodoAction: (...args: unknown[]) => listar(...args),
  cancelarConsultaAction: vi.fn(),
  confirmarConsultaAction: vi.fn(),
  remarcarConsultaAction: vi.fn(),
  marcarConsultaAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("./AgendaGrid", () => ({
  AgendaGrid: () => <div data-testid="quadro">Quadro</div>,
}));

vi.mock("./AgendaLista", () => ({
  AgendaLista: () => <div data-testid="lista">Lista</div>,
}));

vi.mock("./NovoAgendamentoModal", () => ({
  NovoAgendamentoModal: () => null,
}));

vi.mock("./DetalhesAgendamentoModal", () => ({
  DetalhesAgendamentoModal: () => null,
}));

import { AgendaPageClient } from "./AgendaPageClient";

describe("AgendaPageClient — fetch único", () => {
  beforeEach(() => {
    listar.mockClear();
    replace.mockClear();
    localStorage.clear();
  });

  it("alternar Quadro/Lista não chama ListarAgendamentosDoPeriodo de novo", async () => {
    const user = userEvent.setup();
    render(
      <AgendaPageClient
        contexto={{
          clinicaId: "c1",
          usuarioId: "u1",
          papel: "admin",
          profissionalId: "p1",
          permissoes: {
            marcar: true,
            remarcar: true,
            cancelar: true,
            confirmar: true,
          },
        }}
        iniciais={[]}
        dataInicioIso="2026-08-03T03:00:00.000Z"
        dataFimIso="2026-08-04T03:00:00.000Z"
        modoInicial="dia"
        referenciaIso="2026-08-03T15:00:00.000Z"
        profissionais={[{ id: "p1", label: "Dr." }]}
        pacientes={[]}
        procedimentos={[]}
      />,
    );

    expect(listar).not.toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: "Lista" }));
    await user.click(screen.getByRole("tab", { name: "Quadro" }));
    await user.click(screen.getByRole("tab", { name: "Lista" }));
    expect(listar).not.toHaveBeenCalled();
  });
});
