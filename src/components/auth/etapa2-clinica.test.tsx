import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const signInEmail = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: null, isPending: false }),
    signIn: { email: (...args: unknown[]) => signInEmail(...args) },
  },
}));

import { SignupClinicaForm } from "./SignupClinicaForm";
import {
  RASCUNHO_CADASTRO_KEY,
  limparRascunhoCadastro,
  salvarRascunhoCadastro,
  salvarSenhaCadastroEmMemoria,
  type RascunhoCadastro,
} from "@/lib/cadastro/rascunho";

const rascunho: RascunhoCadastro = {
  adminNome: "Admin",
  email: "admin@clinica.com",
  planoId: "plano-basico",
};

describe("SignupClinicaForm (etapa 2)", () => {
  beforeEach(() => {
    replace.mockClear();
    signInEmail.mockClear();
    limparRascunhoCadastro();
    sessionStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign: vi.fn() },
    });
  });

  it("mostra erros de validação com rascunho presente", async () => {
    salvarRascunhoCadastro(rascunho);
    salvarSenhaCadastroEmMemoria("SenhaForte!123");
    const concluirCadastro = vi.fn();
    const user = userEvent.setup();
    render(<SignupClinicaForm concluirCadastro={concluirCadastro} />);

    expect(await screen.findByText(/admin@clinica.com/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Criar clínica e entrar" }),
    );

    expect(
      await screen.findByText("Informe o nome da clínica."),
    ).toBeInTheDocument();
    expect(concluirCadastro).not.toHaveBeenCalled();
  });

  it("pede senha de novo se a memória sumiu (reload)", async () => {
    salvarRascunhoCadastro(rascunho);
    const concluirCadastro = vi.fn().mockResolvedValue({
      data: { clinicaId: "c1", email: rascunho.email },
    });
    const user = userEvent.setup();
    render(<SignupClinicaForm concluirCadastro={concluirCadastro} />);

    expect(
      await screen.findByText(/senha não fica salva no navegador/i),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nome da clínica"), "Clinica Teste");
    await user.type(screen.getByLabelText("Endereço"), "Rua A, 1");
    await user.type(screen.getByLabelText("CNPJ"), "11222333000181");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte!123");

    await user.click(
      screen.getByRole("button", { name: "Criar clínica e entrar" }),
    );

    await waitFor(() => {
      expect(concluirCadastro).toHaveBeenCalled();
    });
    expect(concluirCadastro.mock.calls[0]?.[0].admin.senha).toBe(
      "SenhaForte!123",
    );
  });

  it("conclui cadastro, autentica e vai ao dashboard", async () => {
    salvarRascunhoCadastro(rascunho);
    salvarSenhaCadastroEmMemoria("SenhaForte!123");
    const concluirCadastro = vi.fn().mockResolvedValue({
      data: { clinicaId: "c1", email: rascunho.email },
    });

    const user = userEvent.setup();
    render(<SignupClinicaForm concluirCadastro={concluirCadastro} />);

    await screen.findByText(/admin@clinica.com/);
    await user.type(screen.getByLabelText("Nome da clínica"), "Clinica Teste");
    await user.type(screen.getByLabelText("Endereço"), "Rua A, 1");
    await user.type(screen.getByLabelText("CNPJ"), "11222333000181");
    await user.click(screen.getByRole("radio", { name: /Verde/i }));

    await user.click(
      screen.getByRole("button", { name: "Criar clínica e entrar" }),
    );

    await waitFor(() => {
      expect(concluirCadastro).toHaveBeenCalled();
    });

    const payload = concluirCadastro.mock.calls[0]?.[0];
    expect(payload.tema).toBe("verde");
    expect(payload.planoId).toBe("plano-basico");
    expect(payload.admin.email).toBe("admin@clinica.com");
    expect(payload.admin.senha).toBe("SenhaForte!123");

    await waitFor(() => {
      expect(signInEmail).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith("/dashboard");
    });
    expect(sessionStorage.getItem(RASCUNHO_CADASTRO_KEY)).toBeNull();
  });
});
