import { describe, expect, it } from "vitest";

import { DocumentoFiscal } from "./DocumentoFiscal";
import { DocumentoFiscalInvalidoError } from "./errors";

describe("DocumentoFiscal", () => {
  it("aceita CPF válido e normaliza para só dígitos", () => {
    const doc = DocumentoFiscal.criar("cpf", "390.533.447-05");
    expect(doc.tipo).toBe("cpf");
    expect(doc.valor).toBe("39053344705");
  });

  it("aceita CNPJ válido e normaliza para só dígitos", () => {
    const doc = DocumentoFiscal.criar("cnpj", "11.222.333/0001-81");
    expect(doc.tipo).toBe("cnpj");
    expect(doc.valor).toBe("11222333000181");
  });

  it("rejeita CPF com dígitos verificadores inválidos", () => {
    expect(() => DocumentoFiscal.criar("cpf", "12345678900")).toThrow(
      DocumentoFiscalInvalidoError,
    );
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(() => DocumentoFiscal.criar("cpf", "11111111111")).toThrow(
      DocumentoFiscalInvalidoError,
    );
  });

  it("rejeita CNPJ com dígitos verificadores inválidos", () => {
    expect(() => DocumentoFiscal.criar("cnpj", "11222333000180")).toThrow(
      DocumentoFiscalInvalidoError,
    );
  });

  it("rejeita CNPJ com todos os dígitos iguais", () => {
    expect(() => DocumentoFiscal.criar("cnpj", "00000000000000")).toThrow(
      DocumentoFiscalInvalidoError,
    );
  });

  it("compara igualdade por tipo e valor", () => {
    const a = DocumentoFiscal.criar("cpf", "39053344705");
    const b = DocumentoFiscal.criar("cpf", "390.533.447-05");
    expect(a.equals(b)).toBe(true);
  });
});
