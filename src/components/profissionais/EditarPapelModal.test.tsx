import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const alterar = vi.fn();

vi.mock("@/actions/profissionais", () => ({
  alterarPapelMembroAction: (...args: unknown[]) => alterar(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { EditarPapelModal } from "./EditarPapelModal";
import { MENSAGEM_CRO_OBRIGATORIO } from "@/lib/profissionais/rotulos";
import type { MembroEquipeDTO } from "@/lib/profissionais/types";

const membro: MembroEquipeDTO = {
  tipo: "membro",
  id: "prof-1",
  nome: "Ana Recepção",
  email: "ana@clinica.com",
  papel: "recepcao",
  cro: null,
  conviteStatus: null,
};

describe("EditarPapelModal", () => {
  beforeEach(() => {
    alterar.mockReset();
  });

  it("barra promoção a dentista sem CRO", async () => {
    const user = userEvent.setup();

    render(
      <EditarPapelModal
        open
        onOpenChange={vi.fn()}
        membro={membro}
        onAtualizado={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Papel"), "dentista");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText(MENSAGEM_CRO_OBRIGATORIO)).toBeInTheDocument();
    expect(alterar).not.toHaveBeenCalled();
  });

  it("salva alteração de papel quando o formulário é válido", async () => {
    const user = userEvent.setup();
    const onAtualizado = vi.fn();
    alterar.mockResolvedValue({
      data: { ...membro, papel: "admin" },
    });

    render(
      <EditarPapelModal
        open
        onOpenChange={vi.fn()}
        membro={membro}
        onAtualizado={onAtualizado}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Papel"), "admin");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(alterar).toHaveBeenCalledWith({
        profissionalId: "prof-1",
        novoPapel: "admin",
      });
    });
    expect(onAtualizado).toHaveBeenCalledWith(
      expect.objectContaining({ papel: "admin" }),
    );
  });
});
