import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/profissionais", () => ({
  listarEquipeAction: vi.fn(),
  convidarUsuarioAction: vi.fn(),
  alterarPapelMembroAction: vi.fn(),
  removerMembroAction: vi.fn(),
  revogarSessoesDoMembroAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { ProfissionaisPageClient } from "./ProfissionaisPageClient";
import type { EquipeInicial } from "@/lib/profissionais/carregar-equipe";

const iniciais: EquipeInicial = {
  papel: "admin",
  profissionalId: "prof-admin",
  linhas: [
    {
      tipo: "membro",
      id: "prof-admin",
      nome: "Admin Geral",
      email: "admin@clinica.com",
      papel: "admin",
      cro: null,
      conviteStatus: null,
    },
  ],
};

describe("ProfissionaisPageClient — RBAC", () => {
  it("mostra o botão Convidar para admin", () => {
    render(<ProfissionaisPageClient iniciais={iniciais} />);
    expect(screen.getByRole("button", { name: "Convidar" })).toBeInTheDocument();
  });

  it("oculta Convidar e ações para dentista", () => {
    render(
      <ProfissionaisPageClient
        iniciais={{ ...iniciais, papel: "dentista" }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Convidar" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ações de/ }),
    ).not.toBeInTheDocument();
  });

  it("oculta Convidar e ações para recepção", () => {
    render(
      <ProfissionaisPageClient
        iniciais={{ ...iniciais, papel: "recepcao" }}
      />,
    );
    expect(screen.queryByRole("button", { name: "Convidar" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ações de/ }),
    ).not.toBeInTheDocument();
  });
});
