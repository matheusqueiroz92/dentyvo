import { describe, expect, it } from "vitest";

import { caminhoProntuarioDoPaciente } from "./navegacao";

describe("caminhoProntuarioDoPaciente", () => {
  it("abre o detalhe do paciente já na aba Prontuário", () => {
    expect(caminhoProntuarioDoPaciente("p-1")).toBe(
      "/pacientes/p-1?aba=prontuario",
    );
  });
});
