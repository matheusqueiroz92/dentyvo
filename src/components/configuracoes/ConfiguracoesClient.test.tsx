import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./AbaAgendamentoOnline", () => ({
  AbaAgendamentoOnline: () => <div>aba-agendamento</div>,
}));

vi.mock("./NotificacoesConfigTab", () => ({
  NotificacoesConfigTab: () => <div>aba-notificacoes</div>,
}));

vi.mock("./GeralConfigTab", () => ({
  GeralConfigTab: () => <div>aba-geral</div>,
}));

vi.mock("./AssinaturaConfigTab", () => ({
  AssinaturaConfigTab: () => <div>aba-assinatura</div>,
}));

import { ConfiguracoesClient } from "./ConfiguracoesClient";

describe("ConfiguracoesClient — abas e RBAC", () => {
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

  it("restringe a aba Geral a admin", () => {
    const { rerender } = render(<ConfiguracoesClient papel="recepcao" />);
    expect(screen.queryByRole("tab", { name: "Geral" })).not.toBeInTheDocument();

    rerender(<ConfiguracoesClient papel="dentista" />);
    expect(screen.queryByRole("tab", { name: "Geral" })).not.toBeInTheDocument();

    rerender(<ConfiguracoesClient papel="admin" />);
    expect(screen.getByRole("tab", { name: "Geral" })).toBeInTheDocument();
  });

  it("restringe a aba Assinatura a admin", () => {
    const { rerender } = render(<ConfiguracoesClient papel="recepcao" />);
    expect(
      screen.queryByRole("tab", { name: "Assinatura" }),
    ).not.toBeInTheDocument();

    rerender(<ConfiguracoesClient papel="dentista" />);
    expect(
      screen.queryByRole("tab", { name: "Assinatura" }),
    ).not.toBeInTheDocument();

    rerender(<ConfiguracoesClient papel="admin" />);
    expect(screen.getByRole("tab", { name: "Assinatura" })).toBeInTheDocument();
  });
});
