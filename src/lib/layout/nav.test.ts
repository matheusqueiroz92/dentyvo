import { describe, expect, it } from "vitest";

import { isNavAtivo, NAV_GROUPS, tituloDaRota } from "./nav";

describe("NAV_GROUPS", () => {
  it("inclui Ajuda e suporte no grupo de sistema, ao lado de Configurações", () => {
    const sistema = NAV_GROUPS.find((grupo) => grupo.id === "sistema");
    expect(sistema?.items.map((item) => item.href)).toEqual([
      "/configuracoes",
      "/ajuda",
    ]);
    expect(sistema?.items.find((item) => item.href === "/ajuda")?.label).toBe(
      "Ajuda e suporte",
    );
  });

  it("inclui Profissionais no grupo principal", () => {
    const principal = NAV_GROUPS.find((grupo) => grupo.id === "principal");
    expect(principal?.items.map((item) => item.href)).toEqual([
      "/dashboard",
      "/agenda",
      "/pacientes",
      "/profissionais",
    ]);
  });
});

describe("tituloDaRota", () => {
  it("usa o título da página de ajuda", () => {
    expect(tituloDaRota("/ajuda")).toBe("Ajuda e suporte");
    expect(tituloDaRota("/profissionais")).toBe("Profissionais");
  });
});

describe("isNavAtivo", () => {
  it("marca /ajuda como ativo só nessa rota", () => {
    expect(isNavAtivo("/ajuda", "/ajuda")).toBe(true);
    expect(isNavAtivo("/configuracoes", "/ajuda")).toBe(false);
  });
});
