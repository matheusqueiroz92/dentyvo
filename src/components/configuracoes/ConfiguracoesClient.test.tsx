import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./AbaAgendamentoOnline", () => ({
  AbaAgendamentoOnline: () => <div>aba-agendamento</div>,
}));

vi.mock("./NotificacoesConfigTab", () => ({
  NotificacoesConfigTab: () => <div>aba-notificacoes</div>,
}));

import { ConfiguracoesClient } from "./ConfiguracoesClient";

describe("ConfiguracoesClient — aba Notificações", () => {
  it.each(["admin", "recepcao", "dentista"] as const)(
    "exibe a aba Notificações para papel %s (sem restrição extra de RBAC)",
    (papel) => {
      render(<ConfiguracoesClient papel={papel} />);
      expect(
        screen.getByRole("tab", { name: "Notificações" }),
      ).toBeInTheDocument();
    },
  );

  it("restringe Agendamento Online a admin", () => {
    const { rerender } = render(<ConfiguracoesClient papel="recepcao" />);
    expect(
      screen.queryByRole("tab", { name: "Agendamento Online" }),
    ).not.toBeInTheDocument();

    rerender(<ConfiguracoesClient papel="admin" />);
    expect(
      screen.getByRole("tab", { name: "Agendamento Online" }),
    ).toBeInTheDocument();
  });
});
