import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { SignupForm } from "@/components/auth/SignupForm";
import { RASCUNHO_CADASTRO_KEY } from "@/lib/cadastro/rascunho";

describe("SignupForm (etapa 1)", () => {
  beforeEach(() => {
    push.mockClear();
    sessionStorage.clear();
  });

  it("mostra erros de validação ao submeter campos vazios", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Informe seu nome.")).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("exige confirmação de senha igual", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Seu nome"), "Admin");
    await user.type(screen.getByLabelText("E-mail"), "admin@clinica.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte!123");
    await user.type(screen.getByLabelText("Confirmar senha"), "outra");
    await user.click(screen.getAllByRole("button", { name: "Selecionar" })[0]!);

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      await screen.findByText("As senhas não coincidem."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("pré-seleciona plano da query e salva rascunho ao continuar", async () => {
    const user = userEvent.setup();
    render(<SignupForm planoInicial="plano-medio" />);

    expect(
      screen.getByRole("button", { name: "Plano selecionado" }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Seu nome"), "Admin");
    await user.type(screen.getByLabelText("E-mail"), "admin@clinica.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte!123");
    await user.type(screen.getByLabelText("Confirmar senha"), "SenhaForte!123");

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/cadastro/clinica");
    });

    const raw = sessionStorage.getItem(RASCUNHO_CADASTRO_KEY);
    expect(raw).toBeTruthy();
    const rascunho = JSON.parse(raw!);
    expect(rascunho.planoId).toBe("plano-medio");
    expect(rascunho.email).toBe("admin@clinica.com");
  });

  it("mostra o indicador de promoção de lançamento", () => {
    render(<SignupForm />);
    expect(screen.getByRole("status")).toHaveTextContent(/30 primeiras/);
  });
});
