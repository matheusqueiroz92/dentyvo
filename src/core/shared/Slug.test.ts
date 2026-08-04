import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "./errors";
import { Slug } from "./Slug";

describe("Slug", () => {
  it("aceita slug normalizado válido", () => {
    expect(Slug.criar("clinica-sorriso").valor).toBe("clinica-sorriso");
    expect(Slug.criar("  Dra-Ana  ").valor).toBe("dra-ana");
  });

  it("rejeita vazio, maiúsculas residuais inválidas e caracteres especiais", () => {
    expect(() => Slug.criar("")).toThrow(DadosInvalidosError);
    expect(() => Slug.criar("Clinica_Sorriso")).toThrow(DadosInvalidosError);
    expect(() => Slug.criar("-inicio")).toThrow(DadosInvalidosError);
    expect(() => Slug.criar("fim-")).toThrow(DadosInvalidosError);
  });

  it("deriva slug a partir do nome (sem acentos)", () => {
    expect(Slug.criarAPartirDoNome("Consultório Silva").valor).toBe(
      "consultorio-silva",
    );
    expect(Slug.criarAPartirDoNome("Dr. João & Cia").valor).toBe("dr-joao-cia");
  });

  it("rejeita nome que não gera slug útil", () => {
    expect(() => Slug.criarAPartirDoNome("@@@")).toThrow(DadosInvalidosError);
  });
});
