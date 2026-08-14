import { describe, expect, it } from "vitest";

import {
  promocaoAindaAtiva,
  promocaoJaEncerrada,
} from "./promocao-painel";

describe("promocaoAindaAtiva / promocaoJaEncerrada", () => {
  it("trata promoção vigente quando há data-limite e ainda não migrou", () => {
    const d = {
      precoPromocionalAteIso: "2027-08-01T12:00:00.000Z",
      migradaParaPrecoCheioEmIso: null,
    };
    expect(promocaoAindaAtiva(d)).toBe(true);
    expect(promocaoJaEncerrada(d)).toBe(false);
  });

  it("trata promoção encerrada quando já migrada para preço cheio", () => {
    const d = {
      precoPromocionalAteIso: "2026-08-01T12:00:00.000Z",
      migradaParaPrecoCheioEmIso: "2026-08-02T12:00:00.000Z",
    };
    expect(promocaoAindaAtiva(d)).toBe(false);
    expect(promocaoJaEncerrada(d)).toBe(true);
  });

  it("não marca promoção quando não há benefício persistido", () => {
    const d = {
      precoPromocionalAteIso: null,
      migradaParaPrecoCheioEmIso: null,
    };
    expect(promocaoAindaAtiva(d)).toBe(false);
    expect(promocaoJaEncerrada(d)).toBe(false);
  });
});
