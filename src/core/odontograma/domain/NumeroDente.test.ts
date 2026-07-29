import { describe, expect, it } from "vitest";

import { NumeroDenteInvalidoError } from "./errors";
import {
  NUMEROS_DENTE_DECIDUOS,
  NUMEROS_DENTE_PERMANENTES,
  NumeroDente,
} from "./NumeroDente";

describe("NumeroDente", () => {
  it("aceita permanentes FDI 11–18, 21–28, 31–38 e 41–48", () => {
    for (const n of NUMEROS_DENTE_PERMANENTES) {
      const dente = NumeroDente.criar(n);
      expect(dente.valor).toBe(n);
      expect(dente.ehPermanente).toBe(true);
      expect(dente.ehDeciduo).toBe(false);
    }
  });

  it("aceita decíduos FDI 51–55, 61–65, 71–75 e 81–85", () => {
    for (const n of NUMEROS_DENTE_DECIDUOS) {
      const dente = NumeroDente.criar(n);
      expect(dente.valor).toBe(n);
      expect(dente.ehDeciduo).toBe(true);
      expect(dente.ehPermanente).toBe(false);
    }
  });

  it.each([19, 20, 29, 30, 39, 40, 49, 50, 56, 60, 66, 70, 76, 80, 86, 91, 0, -1])(
    "rejeita número fora das faixas FDI válidas (%s)",
    (numero) => {
      expect(() => NumeroDente.criar(numero)).toThrow(NumeroDenteInvalidoError);
      expect(NumeroDente.ehValido(numero)).toBe(false);
    },
  );

  it("rejeita número não inteiro", () => {
    expect(() => NumeroDente.criar(11.5)).toThrow(NumeroDenteInvalidoError);
  });
});
