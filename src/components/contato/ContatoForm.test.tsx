import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const enviarMensagemContato = vi.fn();
vi.mock("@/lib/contato/enviar", () => ({
  enviarMensagemContato: (...args: unknown[]) => enviarMensagemContato(...args),
}));

import { ContatoForm } from "./ContatoForm";

describe("ContatoForm", () => {
  beforeEach(() => {
    enviarMensagemContato.mockReset();
  });

  it("na landing mostra nome, e-mail e mensagem — sem tipo nem assunto", () => {
    render(<ContatoForm variante="landing" />);

    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensagem")).toBeInTheDocument();
    expect(screen.queryByLabelText("Assunto")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Bug" })).not.toBeInTheDocument();
  });

  it("no suporte pré-preenche o nome e pede assunto, descrição e tipo", () => {
    render(<ContatoForm variante="suporte" nomePadrao="Dra. Marina" />);

    expect(screen.getByLabelText("Nome")).toHaveValue("Dra. Marina");
    expect(screen.getByLabelText("Assunto")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dúvida" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Bug" })).toBeInTheDocument();
    expect(screen.queryByLabelText("E-mail")).not.toBeInTheDocument();
  });

  it("envia o relato de suporte pelo mesmo mecanismo da landing", async () => {
    const user = userEvent.setup();
    render(<ContatoForm variante="suporte" nomePadrao="Dra. Marina" />);

    await user.type(screen.getByLabelText("Assunto"), "Erro na agenda");
    await user.type(
      screen.getByLabelText("Descrição"),
      "A agenda do dia não lista as consultas.",
    );
    await user.click(screen.getByRole("radio", { name: "Bug" }));
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(enviarMensagemContato).toHaveBeenCalledWith({
      nome: "Dra. Marina",
      assunto: "Erro na agenda",
      mensagem: "A agenda do dia não lista as consultas.",
      tipo: "bug",
    });
  });
});
