import { describe, expect, it } from "vitest";

import { intervalosSobrepoem } from "./intervalo";

function utc(h: number, m = 0) {
  return new Date(Date.UTC(2026, 6, 27, h, m, 0));
}

describe("intervalosSobrepoem (half-open [inicio, fim))", () => {
  it("permite intervalos contíguos (fim de um = início do outro)", () => {
    expect(
      intervalosSobrepoem(utc(9), utc(10), utc(10), utc(11)),
    ).toBe(false);
  });

  it("bloqueia interseção de 1 minuto", () => {
    expect(
      intervalosSobrepoem(utc(9), utc(10), utc(9, 59), utc(10, 30)),
    ).toBe(true);
  });

  it("bloqueia o mesmo intervalo (limites exatamente iguais)", () => {
    expect(
      intervalosSobrepoem(utc(9), utc(10), utc(9), utc(10)),
    ).toBe(true);
  });

  it("bloqueia sobreposição parcial no meio", () => {
    expect(
      intervalosSobrepoem(utc(9), utc(11), utc(10), utc(12)),
    ).toBe(true);
  });

  it("não detecta sobreposição quando um intervalo está totalmente à esquerda", () => {
    expect(
      intervalosSobrepoem(utc(8), utc(9), utc(9, 1), utc(10)),
    ).toBe(false);
  });
});
