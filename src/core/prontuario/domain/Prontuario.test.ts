import { describe, expect, it } from "vitest";

import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import { Prontuario } from "./Prontuario";

function criarProntuarioValido(
  overrides: Partial<Parameters<typeof Prontuario.criar>[0]> = {},
) {
  return Prontuario.criar({
    id: "pront-1",
    clinicaId: "clinica-1",
    pacienteId: "pac-1",
    ...overrides,
  });
}

describe("Prontuario", () => {
  it("cria prontuário vinculado a paciente e clínica", () => {
    const prontuario = criarProntuarioValido();
    expect(prontuario.pacienteId).toBe("pac-1");
    expect(prontuario.clinicaId).toBe("clinica-1");
    expect(prontuario.criadoEm).toBeInstanceOf(Date);
  });

  it("rejeita ids vazios", () => {
    expect(() => criarProntuarioValido({ id: "  " })).toThrow(
      DadosInvalidosError,
    );
    expect(() => criarProntuarioValido({ clinicaId: "" })).toThrow(
      DadosInvalidosError,
    );
    expect(() => criarProntuarioValido({ pacienteId: " " })).toThrow(
      DadosInvalidosError,
    );
  });

  it("assertPertenceAClinica falha quando o tenant não bate", () => {
    const prontuario = criarProntuarioValido();
    expect(() => prontuario.assertPertenceAClinica("outra-clinica")).toThrow(
      TenantMismatchError,
    );
  });
});
