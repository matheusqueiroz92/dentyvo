import { describe, expect, it } from "vitest";

import { TenantMismatchError } from "@/core/shared/errors";

import { Anamnese } from "./Anamnese";

const respostas = {
  historicoMedico: { texto: "Histórico ok", negado: false },
  alergias: { texto: null, negado: true },
  medicacoesEmUso: { texto: null, negado: true },
  condicoesPreexistentes: { texto: null, negado: true },
};

describe("Anamnese", () => {
  it("criarInicial gera snapshot na versão 1", () => {
    const anamnese = Anamnese.criarInicial({
      id: "ana-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      respostas,
      preenchidoPorProfissionalId: "prof-1",
    });

    expect(anamnese.versao).toBe(1);
    expect(anamnese.prontuarioId).toBe("pront-1");
  });

  it("criarProximaVersao gera snapshot completo sem sobrescrever a vigente", () => {
    const vigente = Anamnese.criarInicial({
      id: "ana-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      respostas,
      preenchidoPorProfissionalId: "prof-1",
    });

    const nova = Anamnese.criarProximaVersao({
      id: "ana-2",
      vigente,
      respostas: {
        ...respostas,
        alergias: { texto: "Látex", negado: false },
      },
      preenchidoPorProfissionalId: "prof-2",
    });

    expect(nova.versao).toBe(2);
    expect(nova.id).not.toBe(vigente.id);
    expect(vigente.versao).toBe(1);
    expect(vigente.respostas.alergias.negado).toBe(true);
    expect(nova.respostas.alergias.texto).toBe("Látex");
  });

  it("assertPertenceAClinica falha quando o tenant não bate", () => {
    const anamnese = Anamnese.criarInicial({
      id: "ana-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      respostas,
      preenchidoPorProfissionalId: "prof-1",
    });
    expect(() => anamnese.assertPertenceAClinica("outra-clinica")).toThrow(
      TenantMismatchError,
    );
  });
});
