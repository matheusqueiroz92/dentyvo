import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn().mockResolvedValue({});
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: (...args: unknown[]) => signOut(...args),
  },
}));

const criarClinicaComAdminAction = vi.fn();
vi.mock("@/actions/criar-clinica-com-admin", () => ({
  criarClinicaComAdminAction: (...args: unknown[]) =>
    criarClinicaComAdminAction(...args),
}));

import { SignupForm } from "@/components/auth/SignupForm";

describe("SignupForm", () => {
  beforeEach(() => {
    signOut.mockClear();
    criarClinicaComAdminAction.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: vi.fn() },
    });
  });

  it("mostra erros de validação ao submeter campos vazios", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.click(
      screen.getByRole("button", { name: "Começar trial grátis" }),
    );

    expect(
      await screen.findByText("Informe o nome da clínica."),
    ).toBeInTheDocument();
    expect(screen.getByText("Informe o endereço.")).toBeInTheDocument();
    expect(criarClinicaComAdminAction).not.toHaveBeenCalled();
  });

  it("mostra spinner e desabilita o botão durante o submit", async () => {
    const user = userEvent.setup();
    let resolveAction!: (value: { data: { clinicaId: string } }) => void;
    criarClinicaComAdminAction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(<SignupForm />);
    await user.type(screen.getByLabelText("Nome da clínica"), "Clínica Teste");
    await user.type(screen.getByLabelText("Endereço"), "Rua A, 1");
    await user.type(screen.getByLabelText("CNPJ"), "11222333000181");
    await user.type(screen.getByLabelText("Seu nome"), "Admin");
    await user.type(screen.getByLabelText("E-mail"), "admin@clinica.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte!123");

    const submitPromise = user.click(
      screen.getByRole("button", { name: "Começar trial grátis" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-submit-spinner")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Criando clínica/ }),
      ).toBeDisabled();
    });

    resolveAction({ data: { clinicaId: "c1" } });
    await submitPromise;
  });

  it("mostra mensagem amigável quando a action retorna erro", async () => {
    const user = userEvent.setup();
    criarClinicaComAdminAction.mockResolvedValue({
      serverError: {
        codigo: "DocumentoClinicaDuplicadoError",
        mensagem: "Já existe uma clínica com este documento fiscal.",
      },
    });

    render(<SignupForm />);
    await user.type(screen.getByLabelText("Nome da clínica"), "Clínica Teste");
    await user.type(screen.getByLabelText("Endereço"), "Rua A, 1");
    await user.type(screen.getByLabelText("CNPJ"), "11222333000181");
    await user.type(screen.getByLabelText("Seu nome"), "Admin");
    await user.type(screen.getByLabelText("E-mail"), "admin@clinica.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte!123");
    await user.click(
      screen.getByRole("button", { name: "Começar trial grátis" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe uma clínica com este documento fiscal.",
    );
    expect(signOut).not.toHaveBeenCalled();
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
