import { describe, expect, it } from "vitest";

import { periodoDoDia } from "./periodo-dia";

describe("periodoDoDia", () => {
  it("retorna intervalo half-open do dia civil em America/Sao_Paulo", () => {
    // 2026-07-27 15:00 UTC = 12:00 em São Paulo
    const { dataInicio, dataFim } = periodoDoDia(
      new Date("2026-07-27T15:00:00.000Z"),
    );

    expect(dataInicio.toISOString()).toBe("2026-07-27T03:00:00.000Z");
    expect(dataFim.toISOString()).toBe("2026-07-28T03:00:00.000Z");
    expect(dataInicio.getTime()).toBeLessThan(dataFim.getTime());
  });
});
