import { describe, expect, it } from "vitest";

import { ClassificacaoFurca } from "./ClassificacaoFurca";
import { GrauForaDoSistemaError, SistemaFurcaInvalidoError } from "./errors";

describe("ClassificacaoFurca", () => {
  it.each([1, 2, 3] as const)(
    "aceita Hamp grau %s (uso rotineiro)",
    (grau) => {
      const furca = ClassificacaoFurca.criar({ sistema: "hamp", grau });
      expect(furca.sistema).toBe("hamp");
      expect(furca.grau).toBe(grau);
    },
  );

  it("rejeita Hamp grau 4 (GrauForaDoSistemaError)", () => {
    expect(() =>
      ClassificacaoFurca.criar({ sistema: "hamp", grau: 4 }),
    ).toThrow(GrauForaDoSistemaError);
  });

  it.each([1, 2, 3, 4] as const)(
    "aceita Glickman grau %s (periodontite aguda)",
    (grau) => {
      const furca = ClassificacaoFurca.criar({ sistema: "glickman", grau });
      expect(furca.sistema).toBe("glickman");
      expect(furca.grau).toBe(grau);
    },
  );

  it.each([0, 5] as const)(
    "rejeita Glickman grau %s (GrauForaDoSistemaError)",
    (grau) => {
      expect(() =>
        ClassificacaoFurca.criar({ sistema: "glickman", grau }),
      ).toThrow(GrauForaDoSistemaError);
    },
  );

  it("rejeita sistema desconhecido", () => {
    expect(() =>
      ClassificacaoFurca.criar({ sistema: "miller", grau: 1 }),
    ).toThrow(SistemaFurcaInvalidoError);
  });

  it("graus de sistemas diferentes não são iguais (não comparáveis)", () => {
    const hamp = ClassificacaoFurca.criar({ sistema: "hamp", grau: 2 });
    const glickman = ClassificacaoFurca.criar({
      sistema: "glickman",
      grau: 2,
    });
    expect(hamp.equals(glickman)).toBe(false);
  });
});
