import { describe, expect, it } from "vitest";

import {
  cpfEhValido,
  formatarCpfCompleto,
  formatarCpfMascarado,
  apenasDigitos,
} from "./cpf";

describe("cpf (helpers de UI)", () => {
  it("aceita CPF válido com máscara e normaliza dígitos", () => {
    expect(cpfEhValido("390.533.447-05")).toBe(true);
    expect(apenasDigitos("390.533.447-05")).toBe("39053344705");
  });

  it("rejeita CPF com dígito verificador inválido", () => {
    expect(cpfEhValido("12345678900")).toBe(false);
    expect(cpfEhValido("11111111111")).toBe(false);
  });

  it("formata CPF completo e mascarado", () => {
    expect(formatarCpfCompleto("39053344705")).toBe("390.533.447-05");
    expect(formatarCpfMascarado("39053344705")).toBe("390.***.***-05");
  });
});
