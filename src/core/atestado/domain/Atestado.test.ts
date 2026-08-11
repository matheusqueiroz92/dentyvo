import { describe, expect, it } from "vitest";

import type { SnapshotCabecalhoDocumentoProps } from "@/core/shared/SnapshotCabecalhoDocumento";
import { TenantMismatchError } from "@/core/shared/errors";

import { Atestado } from "./Atestado";
import {
  CidFormatoInvalidoError,
  MotivoAtestadoInvalidoError,
  PeriodoAfastamentoInvalidoError,
} from "./errors";

const cabecalhoValido: SnapshotCabecalhoDocumentoProps = {
  clinicaNome: "Clínica Sorriso",
  clinicaEndereco: "Rua A, 100",
  profissionalNome: "Dra. Ana",
  profissionalCro: "12345",
  pacienteNome: "Ana Paciente",
  pacienteCpf: "39053344705",
  pacienteDataNascimento: new Date("1990-05-15T12:00:00.000Z"),
  profissionalEspecialidade: "Ortodontia",
};

function emitirValido(
  override: Partial<{
    id: string;
    motivo: string;
    cid: string | null;
    dataInicio: Date;
    quantidadeDias: number;
    cabecalho: SnapshotCabecalhoDocumentoProps;
    emitidaEm: Date;
  }> = {},
): Atestado {
  return Atestado.emitir({
    id: "atest-1",
    clinicaId: "clinica-1",
    prontuarioId: "pront-1",
    profissionalId: "prof-dentista",
    motivo: "repouso pós-procedimento",
    dataInicio: new Date("2026-08-11T00:00:00.000Z"),
    quantidadeDias: 3,
    cabecalho: cabecalhoValido,
    ...override,
  });
}

describe("Atestado", () => {
  it("emite documento único sem lista de itens, com snapshot e assinatura digital nula", () => {
    const atestado = emitirValido({
      emitidaEm: new Date("2026-08-11T15:00:00.000Z"),
    });

    expect(atestado.id).toBe("atest-1");
    expect(atestado.profissionalId).toBe("prof-dentista");
    expect(atestado.motivo).toBe("repouso pós-procedimento");
    expect(atestado.assinaturaDigitalId).toBeNull();
    expect(atestado.cabecalho.profissionalCro).toBe("12345");
    expect(atestado).not.toHaveProperty("itens");
  });

  it.each(["K08.1", "K081"] as const)(
    "aceita CID de formato válido %s",
    (cid) => {
      expect(emitirValido({ cid }).cid).toBe(cid);
    },
  );

  it("aceita emissão sem CID (campo opcional)", () => {
    expect(emitirValido({ cid: null }).cid).toBeNull();
    expect(emitirValido({ cid: "" }).cid).toBeNull();
    expect(Atestado.emitir({
      id: "atest-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-dentista",
      motivo: "comparecimento",
      dataInicio: new Date("2026-08-11T00:00:00.000Z"),
      quantidadeDias: 1,
      cabecalho: cabecalhoValido,
    }).cid).toBeNull();
  });

  it("rejeita CID com formato inválido na emissão", () => {
    expect(() => emitirValido({ cid: "08" })).toThrow(CidFormatoInvalidoError);
    expect(() => emitirValido({ cid: "repouso" })).toThrow(
      CidFormatoInvalidoError,
    );
  });

  it("calcula dataFim inclusiva em data civil, sem hora", () => {
    const atestado = emitirValido({
      dataInicio: new Date("2026-08-11T18:20:00.000Z"),
      quantidadeDias: 3,
    });

    expect(atestado.dataInicio).toEqual(new Date("2026-08-11T00:00:00.000Z"));
    expect(atestado.dataFim).toEqual(new Date("2026-08-13T00:00:00.000Z"));
    expect(atestado.dataInicio.getUTCHours()).toBe(0);
    expect(atestado.dataFim.getUTCHours()).toBe(0);
  });

  it("rejeita quantidadeDias menor que 1", () => {
    expect(() => emitirValido({ quantidadeDias: 0 })).toThrow(
      PeriodoAfastamentoInvalidoError,
    );
    expect(() => emitirValido({ quantidadeDias: -2 })).toThrow(
      PeriodoAfastamentoInvalidoError,
    );
  });

  it("exige motivo", () => {
    expect(() => emitirValido({ motivo: "   " })).toThrow(
      MotivoAtestadoInvalidoError,
    );
  });

  it("congela snapshot: alteração no objeto de entrada não afeta o atestado", () => {
    const cabecalho = { ...cabecalhoValido };
    const atestado = emitirValido({ cabecalho });

    cabecalho.clinicaNome = "Nome Alterado Depois";
    cabecalho.profissionalCro = "99999";

    expect(atestado.cabecalho.clinicaNome).toBe("Clínica Sorriso");
    expect(atestado.cabecalho.profissionalCro).toBe("12345");
  });

  it("correção cria nova emissão independente (imutabilidade)", () => {
    const original = emitirValido({
      id: "atest-1",
      motivo: "repouso 3 dias",
      quantidadeDias: 3,
      emitidaEm: new Date("2026-08-11T10:00:00.000Z"),
    });

    const correcao = Atestado.emitir({
      id: "atest-2",
      clinicaId: original.clinicaId,
      prontuarioId: original.prontuarioId,
      profissionalId: original.profissionalId,
      motivo: "repouso 5 dias",
      dataInicio: original.dataInicio,
      quantidadeDias: 5,
      cabecalho: original.cabecalho,
      emitidaEm: new Date("2026-08-11T11:00:00.000Z"),
    });

    expect(correcao.id).not.toBe(original.id);
    expect(original.quantidadeDias).toBe(3);
    expect(original.motivo).toBe("repouso 3 dias");
    expect(correcao.quantidadeDias).toBe(5);
    expect(correcao.motivo).toBe("repouso 5 dias");
  });

  it("não expõe API de edição após emissão", () => {
    const metodos = Object.getOwnPropertyNames(Atestado.prototype);

    expect(metodos).not.toContain("editar");
    expect(metodos).not.toContain("atualizar");
    expect(metodos).not.toContain("corrigir");
    expect(typeof Atestado.emitir).toBe("function");
  });

  it("assertPertenceAClinica falha quando o tenant não bate", () => {
    const atestado = emitirValido();

    expect(() => atestado.assertPertenceAClinica("outra-clinica")).toThrow(
      TenantMismatchError,
    );
  });
});
