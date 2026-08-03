import { describe, expect, it } from "vitest";

import { pacienteFormSchema } from "./schema";

describe("pacienteFormSchema", () => {
  it("aceita payload válido", () => {
    const parsed = pacienteFormSchema.safeParse({
      nome: "Ana Silva",
      cpf: "390.533.447-05",
      telefone: "(77) 99999-8888",
      dataNascimento: "1990-05-15",
      contatoEmergencia: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("barra CPF com dígito verificador inválido antes do servidor", () => {
    const parsed = pacienteFormSchema.safeParse({
      nome: "Ana Silva",
      cpf: "123.456.789-00",
      telefone: "(77) 99999-8888",
      dataNascimento: "1990-05-15",
      contatoEmergencia: "",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.includes("cpf"))).toBe(
        true,
      );
    }
  });
});
