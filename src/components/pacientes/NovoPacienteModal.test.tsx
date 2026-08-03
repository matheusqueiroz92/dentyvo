import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const criar = vi.fn();

vi.mock("@/actions/paciente", () => ({
  criarPacienteAction: (...args: unknown[]) => criar(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { NovoPacienteModal } from "./NovoPacienteModal";

describe("NovoPacienteModal", () => {
  beforeEach(() => {
    criar.mockClear();
  });

  it("barra CPF com dígito verificador inválido sem chamar o servidor", async () => {
    const user = userEvent.setup();
    const onCriado = vi.fn();

    render(
      <NovoPacienteModal
        open
        onOpenChange={vi.fn()}
        onCriado={onCriado}
      />,
    );

    await user.type(screen.getByLabelText("Nome"), "Ana Silva");
    await user.type(screen.getByLabelText("CPF"), "12345678900");
    await user.type(screen.getByLabelText("Telefone"), "77999998888");
    await user.type(screen.getByLabelText("Data de nascimento"), "1990-05-15");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(screen.getByText("CPF inválido.")).toBeInTheDocument();
    });
    expect(criar).not.toHaveBeenCalled();
    expect(onCriado).not.toHaveBeenCalled();
  });
});
