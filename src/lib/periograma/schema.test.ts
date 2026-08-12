import { describe, expect, it } from "vitest";

import {
  classificacaoFurcaSchema,
  dentePeriogramaInputSchema,
  registrarPeriogramaSchema,
} from "./schema";

describe("classificacaoFurcaSchema", () => {
  it("aceita Hamp graus 1–3", () => {
    expect(classificacaoFurcaSchema.safeParse({ sistema: "hamp", grau: 2 }).success).toBe(
      true,
    );
  });

  it("rejeita Hamp grau 4 (fora do sistema)", () => {
    const r = classificacaoFurcaSchema.safeParse({ sistema: "hamp", grau: 4 });
    expect(r.success).toBe(false);
  });

  it("aceita Glickman grau 4", () => {
    expect(
      classificacaoFurcaSchema.safeParse({ sistema: "glickman", grau: 4 }).success,
    ).toBe(true);
  });
});

describe("dentePeriogramaInputSchema", () => {
  it("rejeita furca em dente não-molar", () => {
    const r = dentePeriogramaInputSchema.safeParse({
      numeroDente: 11,
      classificacaoFurca: { sistema: "hamp", grau: 1 },
    });
    expect(r.success).toBe(false);
  });

  it("aceita furca em molar", () => {
    const r = dentePeriogramaInputSchema.safeParse({
      numeroDente: 16,
      classificacaoFurca: { sistema: "hamp", grau: 1 },
      pontos: [
        {
          lado: "vestibular",
          posicao: "mesial",
          margemGengival: -1,
          profundidadeSondagem: 3,
        },
      ],
    });
    expect(r.success).toBe(true);
  });
});

describe("registrarPeriogramaSchema", () => {
  it("exige ao menos um dente", () => {
    const r = registrarPeriogramaSchema.safeParse({
      prontuarioId: "11111111-1111-4111-8111-111111111111",
      tipo: "exame_inicial",
      dentes: [],
    });
    expect(r.success).toBe(false);
  });
});
