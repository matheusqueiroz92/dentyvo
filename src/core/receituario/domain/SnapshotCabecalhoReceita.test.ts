import { describe, expect, it } from "vitest";

import { SnapshotCabecalhoInvalidoError } from "./errors";
import { SnapshotCabecalhoReceita } from "./SnapshotCabecalhoReceita";

describe("SnapshotCabecalhoReceita", () => {
  it("congela campos obrigatórios e opcionais do cabeçalho", () => {
    const nascimento = new Date("1990-05-15T12:00:00.000Z");
    const snapshot = SnapshotCabecalhoReceita.criar({
      clinicaNome: "Clínica Sorriso",
      clinicaEndereco: "Rua A, 100",
      profissionalNome: "Dra. Ana",
      profissionalCro: "12345",
      pacienteNome: "Ana Paciente",
      pacienteCpf: "39053344705",
      pacienteDataNascimento: nascimento,
      profissionalEspecialidade: "Ortodontia",
    });

    expect(snapshot.clinicaNome).toBe("Clínica Sorriso");
    expect(snapshot.clinicaEndereco).toBe("Rua A, 100");
    expect(snapshot.profissionalNome).toBe("Dra. Ana");
    expect(snapshot.profissionalCro).toBe("12345");
    expect(snapshot.pacienteNome).toBe("Ana Paciente");
    expect(snapshot.pacienteCpf).toBe("39053344705");
    expect(snapshot.pacienteDataNascimento).toEqual(nascimento);
    expect(snapshot.profissionalEspecialidade).toBe("Ortodontia");
  });

  it("aceita opcionais ausentes como null", () => {
    const snapshot = SnapshotCabecalhoReceita.criar({
      clinicaNome: "Clínica Sorriso",
      clinicaEndereco: "Rua A, 100",
      profissionalNome: "Dra. Ana",
      profissionalCro: "12345",
      pacienteNome: "Ana Paciente",
      pacienteCpf: "39053344705",
    });

    expect(snapshot.pacienteDataNascimento).toBeNull();
    expect(snapshot.profissionalEspecialidade).toBeNull();
  });

  it.each([
    "clinicaNome",
    "clinicaEndereco",
    "profissionalNome",
    "profissionalCro",
    "pacienteNome",
    "pacienteCpf",
  ] as const)("rejeita %s obrigatório vazio", (campo) => {
    const base = {
      clinicaNome: "Clínica Sorriso",
      clinicaEndereco: "Rua A, 100",
      profissionalNome: "Dra. Ana",
      profissionalCro: "12345",
      pacienteNome: "Ana Paciente",
      pacienteCpf: "39053344705",
    };

    expect(() =>
      SnapshotCabecalhoReceita.criar({ ...base, [campo]: "" }),
    ).toThrow(SnapshotCabecalhoInvalidoError);
  });
});
