import { describe, expect, it } from "vitest";

import { ItemReceitaInvalidoError } from "./errors";
import { ItemReceita } from "./ItemReceita";

describe("ItemReceita", () => {
  it("cria item com os quatro campos estruturados", () => {
    const item = ItemReceita.criar({
      medicamento: "Amoxicilina",
      dosagem: "500 mg",
      posologia: "1 comprimido de 8/8h",
      duracao: "7 dias",
    });

    expect(item.medicamento).toBe("Amoxicilina");
    expect(item.dosagem).toBe("500 mg");
    expect(item.posologia).toBe("1 comprimido de 8/8h");
    expect(item.duracao).toBe("7 dias");
  });

  it.each([
    "medicamento",
    "dosagem",
    "posologia",
    "duracao",
  ] as const)("rejeita %s vazio ou só espaços", (campo) => {
    const base = {
      medicamento: "Amoxicilina",
      dosagem: "500 mg",
      posologia: "1 comprimido de 8/8h",
      duracao: "7 dias",
    };

    expect(() =>
      ItemReceita.criar({ ...base, [campo]: "   " }),
    ).toThrow(ItemReceitaInvalidoError);
  });
});
