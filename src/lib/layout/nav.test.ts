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
});

describe("tituloDaRota", () => {
  it("usa o título da página de ajuda", () => {
    expect(tituloDaRota("/ajuda")).toBe("Ajuda e suporte");
  });
});

describe("isNavAtivo", () => {
  it("marca /ajuda como ativo só nessa rota", () => {
    expect(isNavAtivo("/ajuda", "/ajuda")).toBe(true);
    expect(isNavAtivo("/configuracoes", "/ajuda")).toBe(false);
  });
});
