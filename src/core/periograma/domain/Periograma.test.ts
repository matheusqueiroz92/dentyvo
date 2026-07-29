import { describe, expect, it } from "vitest";

import { TenantMismatchError } from "@/core/shared/errors";

import { TipoPeriogramaInvalidoError } from "./errors";
import { Periograma } from "./Periograma";

describe("Periograma", () => {
  it("registra exame inicial com dentes e pontos parcialmente preenchidos", () => {
    const registradoEm = new Date("2026-07-29T14:00:00.000Z");
    const periograma = Periograma.registrar({
      id: "perio-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-1",
      tipo: "exame_inicial",
      registradoEm,
      dentes: [
        {
          numeroDente: 16,
          mobilidade: 1,
          classificacaoFurca: { sistema: "hamp", grau: 2 },
          pontos: [
            {
              lado: "vestibular",
              posicao: "mesial",
              margemGengival: -1,
              profundidadeSondagem: 4,
            },
          ],
        },
        {
          numeroDente: 11,
          mobilidade: null,
          pontos: [],
        },
      ],
    });

    expect(periograma.tipo).toBe("exame_inicial");
    expect(periograma.registradoEm).toEqual(registradoEm);
    expect(periograma.dentes).toHaveLength(2);
    expect(periograma.dentes[0]?.pontos).toHaveLength(1);
    expect(periograma.dentes[0]?.pontos[0]?.margemGengival).toBe(-1);
  });

  it("reconstitui periograma persistido", () => {
    const original = Periograma.registrar({
      id: "perio-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-1",
      tipo: "exame_inicial",
      dentes: [{ numeroDente: 46, mobilidade: 2 }],
    });

    const reidratado = Periograma.reconstituir({
      id: original.id,
      clinicaId: original.clinicaId,
      prontuarioId: original.prontuarioId,
      profissionalId: original.profissionalId,
      tipo: original.tipo,
      registradoEm: original.registradoEm,
      dentes: original.dentes.map((d) => d.paraProps()),
    });

    expect(reidratado.id).toBe(original.id);
    expect(reidratado.dentes[0]?.mobilidade).toBe(2);
    expect(reidratado.dentes[0]?.numeroDenteValor).toBe(46);
  });

  it("correção é novo exame reavaliacao — não altera o anterior (imutabilidade)", () => {
    const inicial = Periograma.registrar({
      id: "perio-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-1",
      tipo: "exame_inicial",
      registradoEm: new Date("2026-07-01T10:00:00.000Z"),
      dentes: [
        {
          numeroDente: 16,
          mobilidade: 1,
          classificacaoFurca: { sistema: "hamp", grau: 1 },
        },
      ],
    });

    const reavaliacao = Periograma.registrar({
      id: "perio-2",
      clinicaId: inicial.clinicaId,
      prontuarioId: inicial.prontuarioId,
      profissionalId: inicial.profissionalId,
      tipo: "reavaliacao",
      registradoEm: new Date("2026-07-20T10:00:00.000Z"),
      dentes: [
        {
          numeroDente: 16,
          mobilidade: 2,
          classificacaoFurca: { sistema: "glickman", grau: 2 },
        },
      ],
    });

    expect(reavaliacao.id).not.toBe(inicial.id);
    expect(reavaliacao.tipo).toBe("reavaliacao");
    expect(inicial.tipo).toBe("exame_inicial");
    expect(inicial.dentes[0]?.mobilidade).toBe(1);
    expect(reavaliacao.dentes[0]?.mobilidade).toBe(2);
  });

  it("não expõe método de edição in-place no domínio", () => {
    const periograma = Periograma.registrar({
      id: "perio-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-1",
      tipo: "exame_inicial",
    });

    expect(periograma).not.toHaveProperty("atualizar");
    expect(periograma).not.toHaveProperty("editar");
    expect(typeof (periograma as { update?: unknown }).update).toBe(
      "undefined",
    );
  });

  it("rejeita tipo inválido", () => {
    expect(() =>
      Periograma.registrar({
        id: "perio-1",
        clinicaId: "clinica-1",
        prontuarioId: "pront-1",
        profissionalId: "prof-1",
        tipo: "controle",
      }),
    ).toThrow(TipoPeriogramaInvalidoError);
  });

  it("assertPertenceAClinica falha quando o tenant não bate", () => {
    const periograma = Periograma.registrar({
      id: "perio-1",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      profissionalId: "prof-1",
      tipo: "exame_inicial",
    });

    expect(() => periograma.assertPertenceAClinica("outra-clinica")).toThrow(
      TenantMismatchError,
    );
  });
});
