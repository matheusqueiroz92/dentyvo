import { describe, expect, it } from "vitest";

import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import { DuracaoInvalidaError } from "./errors";
import { Procedimento } from "./Procedimento";

describe("Procedimento", () => {
  it("cria procedimento com duração padrão válida", () => {
    const procedimento = Procedimento.criar({
      id: "proc-1",
      clinicaId: "clinica-1",
      nome: "Limpeza",
      duracaoPadraoMinutos: 60,
      valor: 150,
    });
    expect(procedimento.nome).toBe("Limpeza");
    expect(procedimento.duracaoPadraoMinutos).toBe(60);
  });

  it("rejeita duração padrão fora de 15–240 ou não múltipla de 15", () => {
    expect(() =>
      Procedimento.criar({
        id: "proc-1",
        clinicaId: "clinica-1",
        nome: "X",
        duracaoPadraoMinutos: 10,
        valor: 0,
      }),
    ).toThrow(DuracaoInvalidaError);
  });

  it("rejeita nome vazio e valor negativo", () => {
    expect(() =>
      Procedimento.criar({
        id: "proc-1",
        clinicaId: "clinica-1",
        nome: "  ",
        duracaoPadraoMinutos: 30,
        valor: 10,
      }),
    ).toThrow(DadosInvalidosError);

    expect(() =>
      Procedimento.criar({
        id: "proc-1",
        clinicaId: "clinica-1",
        nome: "Ok",
        duracaoPadraoMinutos: 30,
        valor: -1,
      }),
    ).toThrow(DadosInvalidosError);
  });

  it("assertPertenceAClinica falha para outro tenant", () => {
    const procedimento = Procedimento.criar({
      id: "proc-1",
      clinicaId: "clinica-1",
      nome: "Limpeza",
      duracaoPadraoMinutos: 30,
      valor: 0,
    });
    expect(() => procedimento.assertPertenceAClinica("outra")).toThrow(
      TenantMismatchError,
    );
  });
});
