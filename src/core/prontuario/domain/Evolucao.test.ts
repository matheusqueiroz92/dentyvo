import { describe, expect, it } from "vitest";

import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import { Evolucao } from "./Evolucao";
import { RetificacaoInvalidaError } from "./errors";

function criarRegistro(
  overrides: Partial<Parameters<typeof Evolucao.criarRegistro>[0]> = {},
) {
  return Evolucao.criarRegistro({
    id: "evo-1",
    clinicaId: "clinica-1",
    prontuarioId: "pront-1",
    profissionalId: "prof-1",
    descricao: "Paciente relatou sensibilidade no 36.",
    ...overrides,
  });
}

describe("Evolucao", () => {
  it("cria registro append-only com procedimento opcional", () => {
    const evolucao = criarRegistro({ procedimentoId: "proc-opaco" });
    expect(evolucao.tipo).toBe("registro");
    expect(evolucao.procedimentoId).toBe("proc-opaco");
    expect(evolucao.evolucaoRetificadaId).toBeNull();
    expect(evolucao.motivoRetificacao).toBeNull();
  });

  it("rejeita descrição vazia no registro", () => {
    expect(() => criarRegistro({ descricao: "   " })).toThrow(
      DadosInvalidosError,
    );
  });

  it("cria retificação ligada ao registro original com motivo obrigatório", () => {
    const original = criarRegistro();
    const retificacao = Evolucao.criarRetificacao({
      id: "evo-2",
      original,
      profissionalId: "prof-1",
      descricao: "Correção: sensibilidade no 37, não no 36.",
      motivoRetificacao: "Erro de digitação do dente",
    });

    expect(retificacao.tipo).toBe("retificacao");
    expect(retificacao.evolucaoRetificadaId).toBe(original.id);
    expect(retificacao.prontuarioId).toBe(original.prontuarioId);
    expect(retificacao.clinicaId).toBe(original.clinicaId);
    expect(retificacao.motivoRetificacao).toBe("Erro de digitação do dente");
    expect(retificacao.ehRetificacao()).toBe(true);
  });

  it("não permite retificar uma evolução que já é retificação", () => {
    const original = criarRegistro();
    const retificacao = Evolucao.criarRetificacao({
      id: "evo-2",
      original,
      profissionalId: "prof-1",
      descricao: "Texto corrigido",
      motivoRetificacao: "Correção",
    });

    expect(() =>
      Evolucao.criarRetificacao({
        id: "evo-3",
        original: retificacao,
        profissionalId: "prof-1",
        descricao: "Nova tentativa",
        motivoRetificacao: "Outra correção",
      }),
    ).toThrow(RetificacaoInvalidaError);
  });

  it("exige motivo da retificação", () => {
    const original = criarRegistro();
    expect(() =>
      Evolucao.criarRetificacao({
        id: "evo-2",
        original,
        profissionalId: "prof-1",
        descricao: "Texto corrigido",
        motivoRetificacao: "  ",
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("assertPertenceAClinica falha quando o tenant não bate", () => {
    const evolucao = criarRegistro();
    expect(() => evolucao.assertPertenceAClinica("outra-clinica")).toThrow(
      TenantMismatchError,
    );
  });
});
