import { describe, expect, expectTypeOf, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import {
  AuditoriaLog,
  type DetalheAuditoria,
} from "./AuditoriaLog";

function criarAuditoria(
  overrides: Partial<Parameters<typeof AuditoriaLog.criar>[0]> = {},
) {
  return AuditoriaLog.criar({
    id: "aud-1",
    clinicaId: "clinica-1",
    atorUsuarioId: "user-1",
    atorProfissionalId: "prof-1",
    acao: "leitura",
    recursoTipo: "prontuario",
    recursoId: "pront-1",
    pacienteId: "pac-1",
    ...overrides,
  });
}

describe("AuditoriaLog / DetalheAuditoria", () => {
  it("aceita detalhe só com metadados e IDs", () => {
    const log = criarAuditoria({
      acao: "escrita",
      recursoTipo: "anamnese",
      detalhe: {
        versaoAnamnese: 2,
        evolucaoId: "evo-1",
        evolucaoRetificadaId: "evo-0",
        acaoNegada: "consultar_prontuario",
      },
    });

    expect(log.detalhe).toEqual({
      versaoAnamnese: 2,
      evolucaoId: "evo-1",
      evolucaoRetificadaId: "evo-0",
      acaoNegada: "consultar_prontuario",
    });
  });

  it("DetalheAuditoria tipado não admite campos de texto clínico", () => {
    expectTypeOf<DetalheAuditoria>().toHaveProperty("versaoAnamnese");
    expectTypeOf<DetalheAuditoria>().toHaveProperty("evolucaoId");
    expectTypeOf<DetalheAuditoria>().not.toHaveProperty("descricao");
    expectTypeOf<DetalheAuditoria>().not.toHaveProperty("respostas");
    expectTypeOf<DetalheAuditoria>().not.toHaveProperty("textoClinico");
    expectTypeOf<DetalheAuditoria>().not.toHaveProperty("conteudoAnamnese");
  });

  it("descarta chaves clínicas indevidas injetadas em runtime (não persiste PHI)", () => {
    const log = criarAuditoria({
      detalhe: {
        versaoAnamnese: 1,
        // simula payload adulterado / cast indevido
        descricao: "Paciente com abscesso no 36",
        respostas: { alergias: "penicilina" },
      } as DetalheAuditoria & Record<string, unknown>,
    });

    expect(log.detalhe).toEqual({ versaoAnamnese: 1 });
    expect(JSON.stringify(log.detalhe)).not.toContain("abscesso");
    expect(JSON.stringify(log.detalhe)).not.toContain("penicilina");
  });

  it("rejeita versaoAnamnese não inteira", () => {
    expect(() =>
      criarAuditoria({
        detalhe: { versaoAnamnese: 1.5 },
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("rejeita ação ou recurso inválidos", () => {
    expect(() =>
      criarAuditoria({
        acao: "excluir" as "leitura",
      }),
    ).toThrow(DadosInvalidosError);
    expect(() =>
      criarAuditoria({
        recursoTipo: "paciente" as "prontuario",
      }),
    ).toThrow(DadosInvalidosError);
  });
});
