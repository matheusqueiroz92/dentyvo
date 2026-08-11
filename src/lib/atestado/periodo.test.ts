import { describe, expect, it } from "vitest";

import {
  calcularDataFimIso,
  dataCivilUtcDeIso,
  formatarPeriodoAfastamento,
  resumirMotivo,
} from "./periodo";

describe("periodo de atestado (UI)", () => {
  it("calcula data de término inclusiva a partir do ISO civil", () => {
    expect(calcularDataFimIso("2026-08-05", 5)).toBe("2026-08-09");
    expect(calcularDataFimIso("2026-08-11", 1)).toBe("2026-08-11");
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
