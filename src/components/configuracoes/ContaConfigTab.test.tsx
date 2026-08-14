import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const atualizarPerfil = vi.fn();
vi.mock("@/actions/atualizar-perfil-proprio", () => ({
  atualizarPerfilProprioAction: (...args: unknown[]) => atualizarPerfil(...args),
}));

const listAccounts = vi.fn();
const changePassword = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    listAccounts: (...args: unknown[]) => listAccounts(...args),
    changePassword: (...args: unknown[]) => changePassword(...args),
  },
}));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { ContaConfigTab } from "./ContaConfigTab";

describe("ContaConfigTab", () => {
  beforeEach(() => {
    atualizarPerfil.mockReset();
    listAccounts.mockReset();
    changePassword.mockReset();
    refresh.mockReset();
    listAccounts.mockResolvedValue({
      data: [{ providerId: "credential" }],
      error: null,
    });
  });

  it("salva o nome e pede refresh do layout", async () => {
    const user = userEvent.setup();
    atualizarPerfil.mockResolvedValue({ data: { nome: "Maria Silva" } });
    render(<ContaConfigTab nomeInicial="Dr. Carlos" />);

    const campoNome = await screen.findByLabelText("Nome");
    await user.clear(campoNome);
    await user.type(campoNome, "Maria Silva");
    await user.click(screen.getByRole("button", { name: "Salvar nome" }));

    await waitFor(() => {
      expect(atualizarPerfil).toHaveBeenCalledWith({ nome: "Maria Silva" });
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("mostra erro claro quando a senha atual está incorreta", async () => {
    const user = userEvent.setup();
    changePassword.mockResolvedValue({
      error: { code: "INVALID_PASSWORD", message: "Invalid password" },
    });
    render(<ContaConfigTab nomeInicial="Dr. Carlos" />);

    await screen.findByLabelText("Senha atual");
    await user.type(screen.getByLabelText("Senha atual"), "errada123");
    await user.type(screen.getByLabelText("Nova senha"), "novaSenha1");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "novaSenha1");
    await user.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(await screen.findByText("Senha atual incorreta.")).toBeInTheDocument();
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "errada123",
      newPassword: "novaSenha1",
      revokeOtherSessions: true,
    });
  });

  it("oculta a troca de senha quando a conta é só-Google", async () => {
    listAccounts.mockResolvedValue({
      data: [{ providerId: "google" }],
      error: null,
    });
    render(<ContaConfigTab nomeInicial="Dr. Carlos" />);

    expect(
      await screen.findByText(
        "Esta conta entra com Google e não possui senha para alterar.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument();
  });
});
