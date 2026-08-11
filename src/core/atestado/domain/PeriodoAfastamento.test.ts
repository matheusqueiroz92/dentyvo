import { describe, expect, it } from "vitest";

import { PeriodoAfastamentoInvalidoError } from "./errors";
import { PeriodoAfastamento } from "./PeriodoAfastamento";

describe("PeriodoAfastamento", () => {
  it("calcula dataFim inclusiva: dataInicio + (quantidadeDias - 1)", () => {
    const periodo = PeriodoAfastamento.criar(
      new Date("2026-08-11T00:00:00.000Z"),
      3,
    );

    expect(periodo.quantidadeDias).toBe(3);
    expect(periodo.dataInicio).toEqual(new Date("2026-08-11T00:00:00.000Z"));
    expect(periodo.dataFim).toEqual(new Date("2026-08-13T00:00:00.000Z"));
  });

  it("um dia de afastamento tem início igual ao fim", () => {
    const periodo = PeriodoAfastamento.criar(
      new Date("2026-08-11T00:00:00.000Z"),
      1,
    );

    expect(periodo.dataInicio).toEqual(periodo.dataFim);
    expect(periodo.dataFim).toEqual(new Date("2026-08-11T00:00:00.000Z"));
  });

  it("persiste data civil sem hora (descarta componente de horário)", () => {
    const periodo = PeriodoAfastamento.criar(
      new Date("2026-08-11T15:45:30.123Z"),
      2,
    );

    expect(periodo.dataInicio).toEqual(new Date("2026-08-11T00:00:00.000Z"));
    expect(periodo.dataFim).toEqual(new Date("2026-08-12T00:00:00.000Z"));
    expect(periodo.dataInicio.getUTCHours()).toBe(0);
    expect(periodo.dataInicio.getUTCMinutes()).toBe(0);
    expect(periodo.dataFim.getUTCHours()).toBe(0);
  });

  it.each([0, -1, 0.5] as const)(
    "rejeita quantidadeDias %s (mínimo 1, inteiro)",
    (dias) => {
      expect(() =>
        PeriodoAfastamento.criar(new Date("2026-08-11T00:00:00.000Z"), dias),
      ).toThrow(PeriodoAfastamentoInvalidoError);
    },
  );
});
