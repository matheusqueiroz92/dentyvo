import { describe, expect, it } from "vitest";

import { SecaoAnamneseInvalidaError } from "./errors";
import { RespostasAnamnese } from "./RespostasAnamnese";

const base = {
  historicoMedico: { texto: "Nada a declarar clinicamente", negado: false },
  alergias: { texto: null, negado: true },
  medicacoesEmUso: { texto: "Dipirona esporádica", negado: false },
  condicoesPreexistentes: { texto: null, negado: true },
};

describe("RespostasAnamnese", () => {
  it("aceita as 4 seções obrigatórias com texto ou negação", () => {
    const respostas = RespostasAnamnese.criar(base);
    expect(respostas.alergias.negado).toBe(true);
    expect(respostas.historicoMedico.texto).toContain("Nada a declarar");
  });

  it("rejeita seção sem texto e sem flag de negação", () => {
    expect(() =>
      RespostasAnamnese.criar({
        ...base,
        alergias: { texto: null, negado: false },
      }),
    ).toThrow(SecaoAnamneseInvalidaError);
  });

  it("rejeita seção com texto só em branco sem negação", () => {
    expect(() =>
      RespostasAnamnese.criar({
        ...base,
        medicacoesEmUso: { texto: "   ", negado: false },
      }),
    ).toThrow(SecaoAnamneseInvalidaError);
  });
});
