import { describe, expect, it } from "vitest";

import { ItemOrcamento } from "./ItemOrcamento";
import { ItemOrcamentoInvalidoError } from "./errors";

describe("ItemOrcamento", () => {
  it("calcula subtotal como valor × quantidade", () => {
    const item = ItemOrcamento.criar({
      procedimentoId: "proc-1",
      nome: "Limpeza",
      valor: 150,
      quantidade: 2,
    });

    expect(item.subtotal).toBe(300);
  });

  it("usa quantidade 1 quando omitida", () => {
    const item = ItemOrcamento.criar({
      procedimentoId: "proc-1",
      nome: "Limpeza",
      valor: 150,
    });

    expect(item.quantidade).toBe(1);
    expect(item.subtotal).toBe(150);
  });

  it("rejeita quantidade menor que 1", () => {
    expect(() =>
      ItemOrcamento.criar({
        procedimentoId: "proc-1",
        nome: "Limpeza",
        valor: 150,
        quantidade: 0,
      }),
    ).toThrow(ItemOrcamentoInvalidoError);

    expect(() =>
      ItemOrcamento.criar({
        procedimentoId: "proc-1",
        nome: "Limpeza",
        valor: 150,
        quantidade: -1,
      }),
    ).toThrow(ItemOrcamentoInvalidoError);
  });

  it("rejeita quantidade não inteira", () => {
    expect(() =>
      ItemOrcamento.criar({
        procedimentoId: "proc-1",
        nome: "Limpeza",
        valor: 150,
        quantidade: 1.5,
      }),
    ).toThrow(ItemOrcamentoInvalidoError);
  });

  it("rejeita valor negativo", () => {
    expect(() =>
      ItemOrcamento.criar({
        procedimentoId: "proc-1",
        nome: "Limpeza",
        valor: -10,
      }),
    ).toThrow(ItemOrcamentoInvalidoError);
  });

  it("rejeita nome ou procedimentoId vazios", () => {
    expect(() =>
      ItemOrcamento.criar({
        procedimentoId: "  ",
        nome: "Limpeza",
        valor: 10,
      }),
    ).toThrow(ItemOrcamentoInvalidoError);

    expect(() =>
      ItemOrcamento.criar({
        procedimentoId: "proc-1",
        nome: "   ",
        valor: 10,
      }),
    ).toThrow(ItemOrcamentoInvalidoError);
  });
});
