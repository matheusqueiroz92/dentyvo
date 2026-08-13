import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { NotificacaoDashboardDTO } from "@/lib/dashboard/types";

import { ListaNotificacoes } from "./ListaNotificacoes";

const item: NotificacaoDashboardDTO = {
  id: "n-1",
  tipo: "novo_agendamento_publico_pendente",
  titulo: "Novo agendamento pelo link",
  mensagem: "Solicitação pendente de confirmação para 13/08/2026, 09:00.",
  criadaEmIso: "2026-08-13T12:00:00.000Z",
  linkAcao: "/agenda",
  planoNome: null,
  dataReferenciaIso: null,
  valorCentavos: null,
};

describe("ListaNotificacoes", () => {
  it("exibe estado vazio quando não há pendentes", () => {
    render(
      <ListaNotificacoes
        itens={[]}
        onMarcarComoLida={vi.fn()}
        onMarcarTodas={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Nenhuma notificação pendente."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /marcar todas como lidas/i }),
    ).not.toBeInTheDocument();
  });

  it("lista data, tipo amigável e conteúdo — sem o enum cru", () => {
    render(
      <ListaNotificacoes
        itens={[item]}
        onMarcarComoLida={vi.fn()}
        onMarcarTodas={vi.fn()}
      />,
    );

    expect(screen.getByText("Novo agendamento pelo link")).toBeInTheDocument();
    expect(screen.getByRole("time")).toHaveAttribute(
      "dateTime",
      "2026-08-13T12:00:00.000Z",
    );
    expect(
      screen.getByText("Solicitação pendente de confirmação para 13/08/2026, 09:00."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("novo_agendamento_publico_pendente"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir/i })).toHaveAttribute(
      "href",
      "/agenda",
    );
  });

  it("marca uma como lida e todas em lote via callbacks", async () => {
    const user = userEvent.setup();
    const onMarcarComoLida = vi.fn();
    const onMarcarTodas = vi.fn();
    render(
      <ListaNotificacoes
        itens={[item, { ...item, id: "n-2" }]}
        onMarcarComoLida={onMarcarComoLida}
        onMarcarTodas={onMarcarTodas}
      />,
    );

    await user.click(
      screen.getAllByRole("button", { name: /marcar como lida/i })[0]!,
    );
    expect(onMarcarComoLida).toHaveBeenCalledWith("n-1");

    await user.click(
      screen.getByRole("button", { name: /marcar todas como lidas/i }),
    );
    expect(onMarcarTodas).toHaveBeenCalledTimes(1);
  });
});
