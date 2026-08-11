import { describe, expect, it } from "vitest";

import { PeriodoAfastamento } from "@/core/atestado/domain/PeriodoAfastamento";

import {
  calcularDataFimIso,
  dataCivilUtcDeIso,
  formatarPeriodoAfastamento,
  isoCivilUtc,
  resumirMotivo,
} from "./periodo";

describe("periodo de atestado (UI)", () => {
  it("calcula data de término via PeriodoAfastamento (mesma regra da emissão)", () => {
    expect(calcularDataFimIso("2026-08-05", 5)).toBe("2026-08-09");
    expect(calcularDataFimIso("2026-08-11", 1)).toBe("2026-08-11");

    const inicio = dataCivilUtcDeIso("2026-03-01");
    const doDominio = PeriodoAfastamento.criar(inicio, 10);
    expect(calcularDataFimIso("2026-03-01", 10)).toBe(
      isoCivilUtc(doDominio.dataFim),
    );
  });

  it("retorna null para ISO inválido ou quantidadeDias < 1 (preview)", () => {
    expect(calcularDataFimIso("05/08/2026", 5)).toBeNull();
    expect(calcularDataFimIso("2026-08-05", 0)).toBeNull();
  });

  it("formata período no padrão da lista (dia/mês — N dias)", () => {
    const inicio = dataCivilUtcDeIso("2026-08-05");
    const fim = dataCivilUtcDeIso("2026-08-09");
    expect(formatarPeriodoAfastamento(inicio, fim, 5)).toBe(
      "05/08 a 09/08 — 5 dias",
    );
    expect(
      formatarPeriodoAfastamento(
        dataCivilUtcDeIso("2026-08-11"),
        dataCivilUtcDeIso("2026-08-11"),
        1,
      ),
    ).toBe("11/08 a 11/08 — 1 dia");
  });

  it("resume motivo longo e preserva motivo curto", () => {
    expect(resumirMotivo("repouso", 80)).toBe("repouso");
    expect(resumirMotivo("a".repeat(90), 80)).toBe(`${"a".repeat(79)}…`);
  });
});
