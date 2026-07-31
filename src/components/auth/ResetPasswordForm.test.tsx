import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSearchParams = new URLSearchParams("token=tok-teste");

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

const resetPassword = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    resetPassword: (...args: unknown[]) => resetPassword(...args),
  },
}));

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    resetPassword.mockReset();
    mockSearchParams.set("token", "tok-teste");
    mockSearchParams.delete("error");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: vi.fn() },
    });
  });

  it("mostra erros de validação ao submeter campos vazios/inválidos", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(
      await screen.findByText("A senha deve ter pelo menos 8 caracteres."),
    ).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("mostra spinner e desabilita o botão durante o submit", async () => {
    const user = userEvent.setup();
    let resolveReset!: (value: { error: null }) => void;
    resetPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReset = resolve;
        }),
    );

    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText("Nova senha"), "NovaSenha!123");
    await user.type(screen.getByLabelText("Confirmar senha"), "NovaSenha!123");
    const submitPromise = user.click(
      screen.getByRole("button", { name: "Redefinir senha" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-submit-spinner")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Salvando/ })).toBeDisabled();
    });

    resolveReset({ error: null });
    await submitPromise;
  });

  it("mostra mensagem amigável quando authClient retorna erro", async () => {
    const user = userEvent.setup();
    resetPassword.mockResolvedValue({
      error: { message: "Token inválido" },
    });

    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText("Nova senha"), "NovaSenha!123");
    await user.type(screen.getByLabelText("Confirmar senha"), "NovaSenha!123");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Token inválido");
    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
