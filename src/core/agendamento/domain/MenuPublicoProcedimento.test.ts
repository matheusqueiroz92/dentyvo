import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import {
  MAX_ITENS_MENU_PUBLICO,
  MenuPublicoProcedimento,
  MIN_ITENS_MENU_PUBLICO,
} from "./MenuPublicoProcedimento";

describe("MenuPublicoProcedimento", () => {
  it("menu vazio não está configurado", () => {
    const menu = MenuPublicoProcedimento.vazio("cli-1");
    expect(menu.estaConfigurado).toBe(false);
    expect(menu.itens).toHaveLength(0);
  });

  it(`aceita entre ${MIN_ITENS_MENU_PUBLICO} e ${MAX_ITENS_MENU_PUBLICO} itens`, () => {
    const dois = MenuPublicoProcedimento.configurar("cli-1", [
      { rotuloPublico: "Consulta/Avaliação", procedimentoId: "p1" },
      { rotuloPublico: "Limpeza", procedimentoId: "p2" },
    ]);
    expect(dois.estaConfigurado).toBe(true);
    expect(dois.itens).toHaveLength(2);

    const quatro = MenuPublicoProcedimento.configurar("cli-1", [
      { rotuloPublico: "A", procedimentoId: "p1" },
      { rotuloPublico: "B", procedimentoId: "p2" },
      { rotuloPublico: "C", procedimentoId: "p3" },
      { rotuloPublico: "D", procedimentoId: "p4" },
    ]);
    expect(quatro.itens).toHaveLength(4);
  });

  it("rejeita menos de 2 ou mais de 4 itens", () => {
    expect(() =>
      MenuPublicoProcedimento.configurar("cli-1", [
        { rotuloPublico: "Só um", procedimentoId: "p1" },
      ]),
    ).toThrow(DadosInvalidosError);

    expect(() =>
      MenuPublicoProcedimento.configurar("cli-1", [
        { rotuloPublico: "1", procedimentoId: "p1" },
        { rotuloPublico: "2", procedimentoId: "p2" },
        { rotuloPublico: "3", procedimentoId: "p3" },
        { rotuloPublico: "4", procedimentoId: "p4" },
        { rotuloPublico: "5", procedimentoId: "p5" },
      ]),
    ).toThrow(DadosInvalidosError);
  });

  it("rejeita procedimento duplicado e rótulo vazio", () => {
    expect(() =>
      MenuPublicoProcedimento.configurar("cli-1", [
        { rotuloPublico: "A", procedimentoId: "p1" },
        { rotuloPublico: "B", procedimentoId: "p1" },
      ]),
    ).toThrow(DadosInvalidosError);

    expect(() =>
      MenuPublicoProcedimento.configurar("cli-1", [
        { rotuloPublico: "  ", procedimentoId: "p1" },
        { rotuloPublico: "B", procedimentoId: "p2" },
      ]),
    ).toThrow(DadosInvalidosError);
  });
});
