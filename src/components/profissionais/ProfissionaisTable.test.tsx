import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProfissionaisTable } from "./ProfissionaisTable";
import type { LinhaEquipeDTO } from "@/lib/profissionais/types";

const linhas: LinhaEquipeDTO[] = [
  {
    tipo: "convite",
    id: "conv-1",
    nome: "",
    email: "pendente@clinica.com",
    papel: "recepcao",
    cro: null,
    conviteStatus: "pendente",
  },
  {
    tipo: "membro",
    id: "prof-1",
    nome: "Ana Admin",
    email: "ana@clinica.com",
    papel: "admin",
    cro: null,
    conviteStatus: null,
  },
  {
    tipo: "membro",
    id: "prof-2",
    nome: "Dra. Márcia",
    email: "marcia@clinica.com",
    papel: "dentista",
    cro: "77889-SP",
    conviteStatus: null,
  },
];

describe("ProfissionaisTable", () => {
  it("lista nome, e-mail, papel, CRO e convite pendente", () => {
    render(
      <ProfissionaisTable
        linhas={linhas}
        podeGerenciar
        onAlterarPapel={vi.fn()}
        onRemover={vi.fn()}
        onRevogarSessoes={vi.fn()}
      />,
    );

    expect(screen.getByText("Ana Admin")).toBeInTheDocument();
    expect(screen.getByText("ana@clinica.com")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("77889-SP")).toBeInTheDocument();
    expect(screen.getByText("Convite pendente")).toBeInTheDocument();
    expect(screen.getByText("pendente@clinica.com")).toBeInTheDocument();
  });

  it("mostra ações de gestão só para admin e só em membros ativos", async () => {
    const user = userEvent.setup();
    const onAlterarPapel = vi.fn();

    render(
      <ProfissionaisTable
        linhas={linhas}
        podeGerenciar
        onAlterarPapel={onAlterarPapel}
        onRemover={vi.fn()}
        onRevogarSessoes={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Ações de Ana Admin" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ações de pendente/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ações de Ana Admin" }));
    expect(screen.getByText("Alterar papel")).toBeInTheDocument();
    expect(
      screen.getByText("Desconectar de todos os dispositivos"),
    ).toBeInTheDocument();
    expect(screen.getByText("Remover membro")).toBeInTheDocument();
  });

  it("oculta ações de convidar/remover quando não pode gerenciar", () => {
    render(
      <ProfissionaisTable
        linhas={linhas}
        podeGerenciar={false}
        onAlterarPapel={vi.fn()}
        onRemover={vi.fn()}
        onRevogarSessoes={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Ações de/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Convidar" })).not.toBeInTheDocument();
  });
});
