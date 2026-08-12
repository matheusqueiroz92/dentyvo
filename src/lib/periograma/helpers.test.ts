import { describe, expect, it } from "vitest";

import {
  denteParaPayload,
  dentePeriogramaVazio,
  denteTemDados,
  pontoTemMedicao,
} from "./helpers";

describe("denteTemDados", () => {
  it("retorna false para dente vazio", () => {
    expect(denteTemDados(dentePeriogramaVazio(11))).toBe(false);
  });

  it("retorna true com ponto parcial", () => {
    const d = dentePeriogramaVazio(16);
    d.pontos[0] = {
      ...d.pontos[0],
      profundidadeSondagem: 4,
    };
    expect(denteTemDados(d)).toBe(true);
    expect(pontoTemMedicao(d.pontos[0])).toBe(true);
  });
});

describe("denteParaPayload", () => {
  it("omite pontos sem medição", () => {
    const d = dentePeriogramaVazio(16);
    d.pontos[0] = { ...d.pontos[0], margemGengival: -1 };
    d.pontos[1] = { ...d.pontos[1], placa: true };
    const payload = denteParaPayload(d);
    expect(payload.pontos).toHaveLength(2);
  });
});
