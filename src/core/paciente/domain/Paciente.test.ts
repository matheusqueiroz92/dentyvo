import { describe, expect, expectTypeOf, it } from "vitest";

import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import { CpfInvalidoError } from "./errors";
import { Paciente } from "./Paciente";

const CPF_VALIDO = "39053344705";
const nascimento = new Date("1990-05-15T12:00:00.000Z");
const nascimentoNovo = new Date("1991-08-20T12:00:00.000Z");

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

  describe("atualizarDados", () => {
    it("atualiza nome, telefone, nascimento e contato preservando o CPF", () => {
      const original = criarPacienteValido({
        contatoEmergencia: "Contato antigo",
      });

      const atualizado = original.atualizarDados({
        nome: "Ana Atualizada",
        telefone: "(77) 98888-7777",
        dataNascimento: nascimentoNovo,
        contatoEmergencia: "Maria (mãe)",
      });

      expect(atualizado.id).toBe(original.id);
      expect(atualizado.clinicaId).toBe(original.clinicaId);
      expect(atualizado.nome).toBe("Ana Atualizada");
      expect(atualizado.telefone).toBe("77988887777");
      expect(atualizado.dataNascimento).toEqual(nascimentoNovo);
      expect(atualizado.contatoEmergencia).toBe("Maria (mãe)");
      expect(atualizado.cpf.valor).toBe(CPF_VALIDO);
      expect(atualizado.cpf.equals(original.cpf)).toBe(true);
    });

    it("permite limpar contato de emergência com null", () => {
      const original = criarPacienteValido({
        contatoEmergencia: "Alguém",
      });

      const atualizado = original.atualizarDados({
        nome: original.nome,
        telefone: original.telefone,
        dataNascimento: original.dataNascimento,
        contatoEmergencia: null,
      });

      expect(atualizado.contatoEmergencia).toBeNull();
      expect(atualizado.cpf.valor).toBe(CPF_VALIDO);
    });

    it("rejeita nome vazio na atualização", () => {
      const original = criarPacienteValido();
      expect(() =>
        original.atualizarDados({
          nome: "   ",
          telefone: "77999990000",
          dataNascimento: nascimentoNovo,
        }),
      ).toThrow(DadosInvalidosError);
    });

    it("input de atualizarDados não expõe campo cpf", () => {
      type InputAtualizar = Parameters<Paciente["atualizarDados"]>[0];
      expectTypeOf<InputAtualizar>().toHaveProperty("nome");
      expectTypeOf<InputAtualizar>().not.toHaveProperty("cpf");
    });
  });
});

