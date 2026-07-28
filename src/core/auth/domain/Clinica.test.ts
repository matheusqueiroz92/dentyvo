import { describe, expect, it } from "vitest";

import { Clinica } from "./Clinica";
import { DocumentoFiscal } from "./DocumentoFiscal";
import { DadosInvalidosError } from "./errors";

describe("Clinica", () => {
  const documento = DocumentoFiscal.criar("cpf", "39053344705");

  it("cria clínica com status inicial ativa", () => {
    const clinica = Clinica.criar({
      id: "cli-1",
      nome: " Consultório Silva ",
      endereco: " Rua A, 10 ",
      documento,
    });

    expect(clinica.status).toBe("ativa");
    expect(clinica.nome).toBe("Consultório Silva");
    expect(clinica.endereco).toBe("Rua A, 10");
    expect(clinica.documento.equals(documento)).toBe(true);
  });

  it("rejeita nome vazio", () => {
    expect(() =>
      Clinica.criar({
        id: "cli-1",
        nome: "   ",
        endereco: "Rua A",
        documento,
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("rejeita endereço vazio", () => {
    expect(() =>
      Clinica.criar({
        id: "cli-1",
        nome: "Clínica",
        endereco: " ",
        documento,
      }),
    ).toThrow(DadosInvalidosError);
  });
});
