import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "./errors";
import {
  assertTemaClinica,
  isTemaClinica,
  TEMAS_CLINICA,
} from "./TemaClinica";

describe("TemaClinica", () => {
  it.each(TEMAS_CLINICA)("reconhece tema permitido %s", (tema) => {
    expect(isTemaClinica(tema)).toBe(true);
    expect(assertTemaClinica(tema)).toBe(tema);
  });

  it("rejeita valor fora do enum com DadosInvalidosError", () => {
    expect(isTemaClinica("laranja")).toBe(false);
    expect(() => assertTemaClinica("laranja")).toThrow(DadosInvalidosError);
  });
});
