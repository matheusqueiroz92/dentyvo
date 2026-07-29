import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import { Plano } from "./Plano";

describe("Plano (domínio — spec 010)", () => {
  it("cria plano com valor mensal e limitesDeUso opcionais (não enforced no MVP)", () => {
    const plano = Plano.criar({
      id: "plano-1",
      nome: "Pro",
      valorMensal: 199.9,
      limitesDeUso: { maxProfissionais: 10, maxMensagensBotMes: 5000 },
    });

    expect(plano.nome).toBe("Pro");
    expect(plano.valorMensal).toBe(199.9);
    expect(plano.limitesDeUso.maxProfissionais).toBe(10);
  });

  it("rejeita nome vazio ou valorMensal inválido", () => {
    expect(() =>
      Plano.criar({ id: "p1", nome: "  ", valorMensal: 10 }),
    ).toThrow(DadosInvalidosError);

    expect(() =>
      Plano.criar({ id: "p1", nome: "Básico", valorMensal: -1 }),
    ).toThrow(DadosInvalidosError);
  });
});
