import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestPasswordReset = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: (...args: unknown[]) =>
      requestPasswordReset(...args),
  },
}));

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    requestPasswordReset.mockReset();
  });

  it("mostra erro de validação para e-mail inválido", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-mail"), "nao-e-email");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));

    expect(
      await screen.findByText("Informe um e-mail válido."),
    ).toBeInTheDocument();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("mostra spinner e desabilita o botão durante o submit", async () => {
    const user = userEvent.setup();
    let resolveReset!: (value: { error: null }) => void;
    requestPasswordReset.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReset = resolve;
        }),
    );

    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText("E-mail"), "admin@clinica.com");
    const submitPromise = user.click(
      screen.getByRole("button", { name: "Enviar link" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-submit-spinner")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Enviando/ })).toBeDisabled();
    });

    resolveReset({ error: null });
    await submitPromise;
  });

  it("mostra mensagem amigável quando authClient retorna erro", async () => {
    const user = userEvent.setup();
    requestPasswordReset.mockResolvedValue({
      error: { message: "Reset password isn't enabled" },
    });

    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText("E-mail"), "admin@clinica.com");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Reset password isn't enabled",
    );
  });
});
