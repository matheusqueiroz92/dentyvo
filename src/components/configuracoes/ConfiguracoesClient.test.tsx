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

vi.mock("./ContaConfigTab", () => ({
  ContaConfigTab: () => <div>aba-conta</div>,
}));

vi.mock("./AbaWhatsapp", () => ({
  AbaWhatsapp: () => <div>aba-whatsapp</div>,
}));

import { ConfiguracoesClient } from "./ConfiguracoesClient";

function renderConfig(papel: string, abaInicial?: string) {
  return render(
    <ConfiguracoesClient
      papel={papel}
      nomeInicial="Ana"
      abaInicial={abaInicial}
    />,
  );
}

describe("ConfiguracoesClient — abas e RBAC", () => {
  it.each(["admin", "recepcao", "dentista"] as const)(
    "exibe a aba Notificações para papel %s (sem restrição extra de RBAC)",
    (papel) => {
      renderConfig(papel);
      expect(
        screen.getByRole("tab", { name: "Notificações" }),
      ).toBeInTheDocument();
    },
  );

  it.each(["admin", "recepcao", "dentista"] as const)(
    "exibe a aba Conta para papel %s",
    (papel) => {
      renderConfig(papel);
      expect(screen.getByRole("tab", { name: "Conta" })).toBeInTheDocument();
    },
  );

  it("abre a aba Conta quando abaInicial é conta", () => {
    renderConfig("admin", "conta");
    expect(screen.getByRole("tab", { name: "Conta" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("restringe Agendamento Online a admin", () => {
    const { rerender } = renderConfig("recepcao");
    expect(
      screen.queryByRole("tab", { name: "Agendamento Online" }),
    ).not.toBeInTheDocument();

    rerender(
      <ConfiguracoesClient papel="admin" nomeInicial="Ana" />,
    );
    expect(
      screen.getByRole("tab", { name: "Agendamento Online" }),
    ).toBeInTheDocument();
  });

  it("restringe a aba Geral a admin", () => {
    const { rerender } = renderConfig("recepcao");
    expect(screen.queryByRole("tab", { name: "Geral" })).not.toBeInTheDocument();

    rerender(
      <ConfiguracoesClient papel="dentista" nomeInicial="Ana" />,
    );
    expect(screen.queryByRole("tab", { name: "Geral" })).not.toBeInTheDocument();

    rerender(
      <ConfiguracoesClient papel="admin" nomeInicial="Ana" />,
    );
    expect(screen.getByRole("tab", { name: "Geral" })).toBeInTheDocument();
  });

  it("restringe a aba WhatsApp a admin", () => {
    const { rerender } = renderConfig("recepcao");
    expect(
      screen.queryByRole("tab", { name: "WhatsApp" }),
    ).not.toBeInTheDocument();

    rerender(<ConfiguracoesClient papel="dentista" nomeInicial="Ana" />);
    expect(
      screen.queryByRole("tab", { name: "WhatsApp" }),
    ).not.toBeInTheDocument();

    rerender(<ConfiguracoesClient papel="admin" nomeInicial="Ana" />);
    expect(screen.getByRole("tab", { name: "WhatsApp" })).toBeInTheDocument();
  });

  it("abre a aba WhatsApp quando abaInicial é whatsapp", () => {
    renderConfig("admin", "whatsapp");
    expect(screen.getByRole("tab", { name: "WhatsApp" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("ignora abaInicial de aba restrita quando o papel não é admin", () => {
    renderConfig("recepcao", "whatsapp");
    expect(
      screen.queryByRole("tab", { name: "WhatsApp" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Notificações" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("restringe a aba Assinatura a admin", () => {
    const { rerender } = renderConfig("recepcao");
    expect(
      screen.queryByRole("tab", { name: "Assinatura" }),
    ).not.toBeInTheDocument();

    rerender(
      <ConfiguracoesClient papel="dentista" nomeInicial="Ana" />,
    );
    expect(
      screen.queryByRole("tab", { name: "Assinatura" }),
    ).not.toBeInTheDocument();

    rerender(
      <ConfiguracoesClient papel="admin" nomeInicial="Ana" />,
    );
    expect(screen.getByRole("tab", { name: "Assinatura" })).toBeInTheDocument();
  });
});
