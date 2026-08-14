import { describe, expect, it } from "vitest";

import { MENSAGEM_CRO_OBRIGATORIO } from "./rotulos";
import {
  convidarUsuarioFormSchema,
  editarPapelFormSchema,
} from "./schema";

describe("convidarUsuarioFormSchema", () => {
  it("aceita convite de recepção sem CRO", () => {
    const r = convidarUsuarioFormSchema.safeParse({
      email: "nova@clinica.com",
      papel: "recepcao",
      cro: "",
    });
    expect(r.success).toBe(true);
  });

  it("barra dentista sem CRO", () => {
    const r = convidarUsuarioFormSchema.safeParse({
      email: "dra@clinica.com",
      papel: "dentista",
      cro: "   ",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe(MENSAGEM_CRO_OBRIGATORIO);
      expect(r.error.issues[0]?.path).toEqual(["cro"]);
    }
  });

  it("aceita dentista com CRO", () => {
    const r = convidarUsuarioFormSchema.safeParse({
      email: "dra@clinica.com",
      papel: "dentista",
      cro: "77889-SP",
    });
    expect(r.success).toBe(true);
  });
});

describe("editarPapelFormSchema", () => {
  it("barra promoção a dentista sem CRO", () => {
    const r = editarPapelFormSchema.safeParse({
      papel: "dentista",
      cro: "",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toBe(MENSAGEM_CRO_OBRIGATORIO);
    }
  });

  it("aceita admin sem CRO", () => {
    const r = editarPapelFormSchema.safeParse({
      papel: "admin",
      cro: "",
    });
    expect(r.success).toBe(true);
  });
});
