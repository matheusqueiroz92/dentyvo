import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const atualizarTema = vi.fn();

vi.mock("@/actions/configuracoes-clinica", () => ({
  atualizarTemaClinicaAction: (...args: unknown[]) => atualizarTema(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { TemaClinicaProvider, useTemaClinica } from "@/components/layout/tema-clinica-context";
import type { TemaClinica } from "@/core/auth/domain/TemaClinica";
import { TEMAS_CLINICA_UI } from "@/lib/tema-clinica";

import { SeletorTemaClinica } from "./SeletorTemaClinica";

function ShellDeTeste({
  temaInicial,
  children,
}: {
  temaInicial: TemaClinica;
  children: ReactNode;
}) {
  return (
    <TemaClinicaProvider temaInicial={temaInicial}>
      <AtributoTema>{children}</AtributoTema>
    </TemaClinicaProvider>
  );
}

function AtributoTema({ children }: { children: ReactNode }) {
  const { tema } = useTemaClinica();
  return <div data-tema-clinica={tema}>{children}</div>;
}

describe("SeletorTemaClinica", () => {
  beforeEach(() => {
    atualizarTema.mockReset();
  });

  it("mostra os temas pré-definidos do onboarding e destaca o atual", () => {
    render(
      <ShellDeTeste temaInicial="azul-padrao">
        <SeletorTemaClinica temaInicial="azul-padrao" />
      </ShellDeTeste>,
    );

    const opcoes = screen.getAllByRole("radio");
    expect(opcoes).toHaveLength(TEMAS_CLINICA_UI.length);
    expect(screen.getByRole("radio", { name: /Azul padrão/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /Verde/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByText("Roxo")).toBeInTheDocument();
    expect(screen.getByText("Grafite")).toBeInTheDocument();
  });

  it("aplica o tema imediatamente ao clicar, sem diálogo de confirmação", async () => {
    const user = userEvent.setup();
    atualizarTema.mockResolvedValue({ data: { tema: "verde" } });

    const { container } = render(
      <ShellDeTeste temaInicial="azul-padrao">
        <SeletorTemaClinica temaInicial="azul-padrao" />
      </ShellDeTeste>,
    );

    await user.click(screen.getByRole("radio", { name: /Verde/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.querySelector("[data-tema-clinica]")).toHaveAttribute(
      "data-tema-clinica",
      "verde",
    );
    expect(screen.getByRole("radio", { name: /Verde/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(atualizarTema).toHaveBeenCalledWith({ tema: "verde" });
  });

  it("reverte o destaque e informa o erro quando a persistência falha", async () => {
    const user = userEvent.setup();
    atualizarTema.mockResolvedValue({
      serverError: {
        codigo: "ErroInesperado",
        mensagem: "Não foi possível atualizar o tema.",
      },
    });

    const { container } = render(
      <ShellDeTeste temaInicial="azul-padrao">
        <SeletorTemaClinica temaInicial="azul-padrao" />
      </ShellDeTeste>,
    );

    await user.click(screen.getByRole("radio", { name: /Roxo/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("alert"),
      ).toHaveTextContent("Não foi possível atualizar o tema.");
    });
    expect(screen.getByRole("radio", { name: /Azul padrão/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(container.querySelector("[data-tema-clinica]")).toHaveAttribute(
      "data-tema-clinica",
      "azul-padrao",
    );
  });

  it("trata tema persistido nulo como azul padrão", () => {
    render(
      <ShellDeTeste temaInicial="azul-padrao">
        <SeletorTemaClinica temaInicial={null} />
      </ShellDeTeste>,
    );

    expect(screen.getByRole("radio", { name: /Azul padrão/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
