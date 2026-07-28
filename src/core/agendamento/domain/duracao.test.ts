import { describe, expect, it } from "vitest";

import { assertDuracaoValida, calcularDataHoraFim } from "./duracao";
import { DuracaoInvalidaError } from "./errors";

describe("duração de agendamento/procedimento", () => {
  it.each([15, 30, 45, 60, 240] as const)(
    "aceita duração válida de %s minutos",
    (minutos) => {
      expect(() => assertDuracaoValida(minutos)).not.toThrow();
    },
  );

  it.each([0, 14, 16, 20, 241, 250, -15] as const)(
    "rejeita duração inválida de %s minutos (fora de 15–240 ou não múltiplo de 15)",
    (minutos) => {
      expect(() => assertDuracaoValida(minutos)).toThrow(DuracaoInvalidaError);
    },
  );

  it("calcula dataHoraFim a partir do início e da duração", () => {
    const inicio = new Date(Date.UTC(2026, 6, 27, 12, 0, 0));
    const fim = calcularDataHoraFim(inicio, 30);
    expect(fim.getTime()).toBe(inicio.getTime() + 30 * 60_000);
  });
});
