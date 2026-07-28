import { describe, expect, it } from "vitest";

import { Cpf } from "./Cpf";
import { CpfInvalidoError } from "./errors";

/** CPF válido conhecido (mesma fixture do módulo auth). */
const CPF_VALIDO = "39053344705";

describe("Cpf", () => {
  it("normaliza e aceita CPF válido com máscara", () => {
    const cpf = Cpf.criar("390.533.447-05");
    expect(cpf.valor).toBe(CPF_VALIDO);
  });

  it("rejeita CPF com dígitos verificadores inválidos", () => {
    expect(() => Cpf.criar("11111111111")).toThrow(CpfInvalidoError);
    expect(() => Cpf.criar("12345678900")).toThrow(CpfInvalidoError);
  });

  it("rejeita CPF com tamanho incorreto", () => {
    expect(() => Cpf.criar("123")).toThrow(CpfInvalidoError);
  });

  it("considera iguais CPFs com o mesmo valor normalizado", () => {
    expect(Cpf.criar(CPF_VALIDO).equals(Cpf.criar("390.533.447-05"))).toBe(
      true,
    );
  });
});
