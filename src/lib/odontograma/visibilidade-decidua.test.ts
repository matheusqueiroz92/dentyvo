import { describe, expect, it } from "vitest";

import { tipoDentePorFdi } from "./estados";
import {
  IDADE_OCULTAR_DECIDUA,
  deciduaVisivelPorPadrao,
} from "./visibilidade-decidua";

describe("deciduaVisivelPorPadrao", () => {
  const ref = new Date(2026, 7, 6); // 6 ago 2026

  it("oculta decídua por padrão a partir dos 13 anos", () => {
    expect(deciduaVisivelPorPadrao("2013-08-06", ref)).toBe(false); // 13 anos
    expect(deciduaVisivelPorPadrao("1990-01-15", ref)).toBe(false);
  });

  it("mostra decídua por padrão abaixo de 13 anos", () => {
    expect(deciduaVisivelPorPadrao("2013-08-07", ref)).toBe(true); // 12 anos
    expect(deciduaVisivelPorPadrao("2020-01-01", ref)).toBe(true);
  });

  it("usa o limiar 13", () => {
    expect(IDADE_OCULTAR_DECIDUA).toBe(13);
  });
});

describe("tipoDentePorFdi (ilustrações na grade)", () => {
  it("classifica os quatro tipos usados na grade permanente", () => {
    expect(tipoDentePorFdi(11)).toBe("incisivo");
    expect(tipoDentePorFdi(13)).toBe("canino");
    expect(tipoDentePorFdi(14)).toBe("pre_molar");
    expect(tipoDentePorFdi(16)).toBe("molar");
  });
});
