import { describe, expect, it } from "vitest";

import {
  editarDadosClinicaFormSchema,
  MENSAGEM_PELO_MENOS_UM_CAMPO,
} from "./schema";

describe("editarDadosClinicaFormSchema", () => {
  it("aceita só o nome preenchido", () => {
    const parsed = editarDadosClinicaFormSchema.safeParse({
      nome: " Clínica Nova ",
      endereco: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("aceita só o endereço preenchido", () => {
    const parsed = editarDadosClinicaFormSchema.safeParse({
      nome: "  ",
      endereco: "Rua B, 2",
    });
    expect(parsed.success).toBe(true);
  });

  it("barra os dois campos vazios antes de enviar", () => {
    const parsed = editarDadosClinicaFormSchema.safeParse({
      nome: "   ",
      endereco: "",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.length).toBeGreaterThan(0);
      expect(
        parsed.error.issues.every(
          (issue) => issue.message === MENSAGEM_PELO_MENOS_UM_CAMPO,
        ),
      ).toBe(true);
    }
  });
});
