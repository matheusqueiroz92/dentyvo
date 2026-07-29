import { describe, expect, it } from "vitest";

import { TenantMismatchError } from "@/core/shared/errors";

import {
  cabecalhoValido,
  itemReceitaValido,
} from "../application/test-doubles/fakes";
import { ReceitaSemItensError } from "./errors";
import { Receita } from "./Receita";

describe("Receita", () => {
  it("emite com snapshot de cabeçalho, itens e assinatura digital nula (MVP)", () => {
    const emitidaEm = new Date("2026-07-28T15:00:00.000Z");
    const receita = Receita.emitir({
      id: "rec-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-dentista",
      itens: [itemReceitaValido],
      cabecalho: cabecalhoValido,
      emitidaEm,
    });

    expect(receita.id).toBe("rec-1");
    expect(receita.profissionalId).toBe("prof-dentista");
    expect(receita.emitidaEm).toEqual(emitidaEm);
    expect(receita.assinaturaDigitalId).toBeNull();
    expect(receita.itens).toHaveLength(1);
    expect(receita.itens[0]?.medicamento).toBe("Amoxicilina");
    expect(receita.cabecalho.profissionalCro).toBe("12345");
    expect(receita.cabecalho.pacienteNome).toBe("Ana Paciente");
  });

  it("exige ao menos um item", () => {
    expect(() =>
      Receita.emitir({
        id: "rec-1",
        clinicaId: "clinica-1",
        prontuarioId: "pront-1",
        profissionalId: "prof-dentista",
        itens: [],
        cabecalho: cabecalhoValido,
      }),
    ).toThrow(ReceitaSemItensError);
  });

  it("congela o snapshot: alterações no objeto de entrada não afetam a receita", () => {
    const cabecalho = { ...cabecalhoValido };
    const itens = [{ ...itemReceitaValido }];

    const receita = Receita.emitir({
      id: "rec-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-dentista",
      itens,
      cabecalho,
    });

    cabecalho.clinicaNome = "Nome Alterado Depois";
    cabecalho.profissionalCro = "99999";
    itens[0]!.medicamento = "Outro Remédio";

    expect(receita.cabecalho.clinicaNome).toBe("Clínica Sorriso");
    expect(receita.cabecalho.profissionalCro).toBe("12345");
    expect(receita.itens[0]?.medicamento).toBe("Amoxicilina");
  });

  it("correção cria nova emissão independente (imutabilidade)", () => {
    const original = Receita.emitir({
      id: "rec-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-dentista",
      itens: [itemReceitaValido],
      cabecalho: cabecalhoValido,
      emitidaEm: new Date("2026-07-28T10:00:00.000Z"),
    });

    const correcao = Receita.emitir({
      id: "rec-2",
      clinicaId: original.clinicaId,
      prontuarioId: original.prontuarioId,
      profissionalId: original.profissionalId,
      itens: [
        {
          ...itemReceitaValido,
          dosagem: "250 mg",
        },
      ],
      cabecalho: original.cabecalho,
      emitidaEm: new Date("2026-07-28T11:00:00.000Z"),
    });

    expect(correcao.id).not.toBe(original.id);
    expect(original.itens[0]?.dosagem).toBe("500 mg");
    expect(correcao.itens[0]?.dosagem).toBe("250 mg");
  });

  it("assertPertenceAClinica falha quando o tenant não bate", () => {
    const receita = Receita.emitir({
      id: "rec-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-dentista",
      itens: [itemReceitaValido],
      cabecalho: cabecalhoValido,
    });

    expect(() => receita.assertPertenceAClinica("outra-clinica")).toThrow(
      TenantMismatchError,
    );
  });
});
