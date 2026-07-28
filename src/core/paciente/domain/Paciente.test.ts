import { describe, expect, it } from "vitest";

import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import { CpfInvalidoError } from "./errors";
import { Paciente } from "./Paciente";

const CPF_VALIDO = "39053344705";
const nascimento = new Date("1990-05-15T12:00:00.000Z");

function criarPacienteValido(
  overrides: Partial<Parameters<typeof Paciente.criar>[0]> = {},
) {
  return Paciente.criar({
    id: "pac-1",
    clinicaId: "clinica-1",
    nome: "Ana Paciente",
    cpf: CPF_VALIDO,
    telefone: "(77) 99999-8888",
    dataNascimento: nascimento,
    ...overrides,
  });
}

describe("Paciente", () => {
  it("cria paciente com telefone normalizado (apenas dígitos)", () => {
    const paciente = criarPacienteValido();
    expect(paciente.nome).toBe("Ana Paciente");
    expect(paciente.cpf.valor).toBe(CPF_VALIDO);
    expect(paciente.telefone).toBe("77999998888");
    expect(paciente.contatoEmergencia).toBeNull();
  });

  it("rejeita nome vazio", () => {
    expect(() => criarPacienteValido({ nome: "   " })).toThrow(
      DadosInvalidosError,
    );
  });

  it("rejeita telefone vazio", () => {
    expect(() => criarPacienteValido({ telefone: "abc" })).toThrow(
      DadosInvalidosError,
    );
  });

  it("rejeita CPF inválido", () => {
    expect(() => criarPacienteValido({ cpf: "00000000000" })).toThrow(
      CpfInvalidoError,
    );
  });

  it("rejeita data de nascimento inválida", () => {
    expect(() =>
      criarPacienteValido({ dataNascimento: new Date("invalid") }),
    ).toThrow(DadosInvalidosError);
  });

  it("assertPertenceAClinica falha quando o tenant não bate", () => {
    const paciente = criarPacienteValido();
    expect(() => paciente.assertPertenceAClinica("outra-clinica")).toThrow(
      TenantMismatchError,
    );
  });
});
