import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

const signInEmail = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => signInEmail(...args),
      social: vi.fn(),
    },
  },
}));

const obterDestinoPosLogin = vi.fn();
vi.mock("@/actions/obter-destino-pos-login", () => ({
  obterDestinoPosLogin: (...args: unknown[]) => obterDestinoPosLogin(...args),
}));

import { LoginForm } from "@/components/auth/LoginForm";

describe("LoginForm", () => {
  beforeEach(() => {
    signInEmail.mockReset();
    obterDestinoPosLogin.mockReset();
    for (const key of [...mockSearchParams.keys()]) {
      mockSearchParams.delete(key);
    }
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: vi.fn() },
    });
  });

  it("mostra erros de validação ao submeter campos vazios", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it("mostra spinner e desabilita o botão durante o submit", async () => {
    const user = userEvent.setup();
    let resolveSignIn!: (value: { error: null }) => void;
    signInEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
    );
    obterDestinoPosLogin.mockResolvedValue({ ok: true, destino: "/dashboard" });

    render(<LoginForm />);
    await user.type(screen.getByLabelText("E-mail"), "admin@clinica.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte!123");

    const submitPromise = user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-submit-spinner")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Entrando/ })).toBeDisabled();
    });

    resolveSignIn({ error: null });
    await submitPromise;
  });

  it("mostra mensagem amigável quando authClient retorna erro", async () => {
    const user = userEvent.setup();
    signInEmail.mockResolvedValue({
      error: { message: "Invalid email or password" },
    });

    render(<LoginForm />);
    await user.type(screen.getByLabelText("E-mail"), "admin@clinica.com");
    await user.type(screen.getByLabelText("Senha"), "errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("E-mail ou senha inválidos.");
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
