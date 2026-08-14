import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const convidar = vi.fn();

vi.mock("@/actions/profissionais", () => ({
  convidarUsuarioAction: (...args: unknown[]) => convidar(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { ConvidarUsuarioModal } from "./ConvidarUsuarioModal";
import { MENSAGEM_CRO_OBRIGATORIO } from "@/lib/profissionais/rotulos";

describe("ConvidarUsuarioModal", () => {
  beforeEach(() => {
    convidar.mockReset();
  });

  it("barra dentista sem CRO e não chama o servidor", async () => {
    const user = userEvent.setup();
    const onConvidado = vi.fn();

    render(
      <ConvidarUsuarioModal
        open
        onOpenChange={vi.fn()}
        onConvidado={onConvidado}
      />,
    );

    await user.type(screen.getByLabelText("E-mail"), "dra@clinica.com");
    await user.selectOptions(screen.getByLabelText("Papel"), "dentista");
    await user.click(screen.getByRole("button", { name: "Enviar convite" }));

    expect(await screen.findByText(MENSAGEM_CRO_OBRIGATORIO)).toBeInTheDocument();
    expect(convidar).not.toHaveBeenCalled();
    expect(onConvidado).not.toHaveBeenCalled();
  });

  it("envia convite de recepção e inclui o pendente no callback", async () => {
    const user = userEvent.setup();
    const onConvidado = vi.fn();
    convidar.mockResolvedValue({
      data: {
        tipo: "convite",
        id: "conv-1",
        nome: "",
        email: "nova@clinica.com",
        papel: "recepcao",
        cro: null,
        conviteStatus: "pendente",
      },
    });

    render(
      <ConvidarUsuarioModal
        open
        onOpenChange={vi.fn()}
        onConvidado={onConvidado}
      />,
    );

    await user.type(screen.getByLabelText("E-mail"), "nova@clinica.com");
    await user.click(screen.getByRole("button", { name: "Enviar convite" }));

    await waitFor(() => {
      expect(convidar).toHaveBeenCalledWith({
        email: "nova@clinica.com",
        papel: "recepcao",
      });
    });
    expect(onConvidado).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "nova@clinica.com",
        conviteStatus: "pendente",
      }),
    );
  });
});
