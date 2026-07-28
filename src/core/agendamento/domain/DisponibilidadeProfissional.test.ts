import { describe, expect, it } from "vitest";

import {
  assertJanelasSemSobreposicao,
  DisponibilidadeProfissional,
  intervaloCabeNaDisponibilidade,
} from "./DisponibilidadeProfissional";
import { JanelaDisponibilidadeInvalidaError } from "./errors";

function janela(input: {
  id?: string;
  diaDaSemana: number;
  horaInicio: string;
  horaFim: string;
}) {
  return DisponibilidadeProfissional.criar({
    id: input.id ?? "jan-1",
    clinicaId: "clinica-1",
    profissionalId: "prof-1",
    diaDaSemana: input.diaDaSemana,
    horaInicio: input.horaInicio,
    horaFim: input.horaFim,
  });
}

describe("DisponibilidadeProfissional", () => {
  it("permite múltiplas janelas no mesmo dia sem sobreposição (intervalo de almoço)", () => {
    const manha = janela({
      id: "j1",
      diaDaSemana: 1,
      horaInicio: "08:00",
      horaFim: "12:00",
    });
    const tarde = janela({
      id: "j2",
      diaDaSemana: 1,
      horaInicio: "14:00",
      horaFim: "18:00",
    });
    expect(() => assertJanelasSemSobreposicao([manha, tarde])).not.toThrow();
  });

  it("rejeita janelas sobrepostas no mesmo dia", () => {
    const a = janela({
      id: "j1",
      diaDaSemana: 1,
      horaInicio: "08:00",
      horaFim: "13:00",
    });
    const b = janela({
      id: "j2",
      diaDaSemana: 1,
      horaInicio: "12:00",
      horaFim: "18:00",
    });
    expect(() => assertJanelasSemSobreposicao([a, b])).toThrow(
      JanelaDisponibilidadeInvalidaError,
    );
  });

  it("permite janelas contíguas no mesmo dia (half-open)", () => {
    const a = janela({
      id: "j1",
      diaDaSemana: 1,
      horaInicio: "08:00",
      horaFim: "12:00",
    });
    const b = janela({
      id: "j2",
      diaDaSemana: 1,
      horaInicio: "12:00",
      horaFim: "18:00",
    });
    expect(() => assertJanelasSemSobreposicao([a, b])).not.toThrow();
  });

  it("rejeita horaInicio >= horaFim ou formato inválido", () => {
    expect(() =>
      janela({ diaDaSemana: 1, horaInicio: "12:00", horaFim: "12:00" }),
    ).toThrow(JanelaDisponibilidadeInvalidaError);
    expect(() =>
      janela({ diaDaSemana: 1, horaInicio: "9:00", horaFim: "12:00" }),
    ).toThrow(JanelaDisponibilidadeInvalidaError);
  });

  describe("intervalo cabe na disponibilidade", () => {
    const manha = janela({
      diaDaSemana: 1,
      horaInicio: "08:00",
      horaFim: "12:00",
    });
    const tarde = janela({
      id: "j2",
      diaDaSemana: 1,
      horaInicio: "14:00",
      horaFim: "18:00",
    });

    it("aceita consulta que cabe inteira na janela da manhã", () => {
      // 09:00–10:00
      expect(intervaloCabeNaDisponibilidade(9 * 60, 10 * 60, [manha, tarde])).toBe(
        true,
      );
    });

    it("rejeita tentativa de agendar no buraco de almoço", () => {
      // 12:00–13:00
      expect(
        intervaloCabeNaDisponibilidade(12 * 60, 13 * 60, [manha, tarde]),
      ).toBe(false);
    });

    it("rejeita intervalo que ultrapassa o fim da janela", () => {
      // 11:00–12:30
      expect(
        intervaloCabeNaDisponibilidade(11 * 60, 12 * 60 + 30, [manha, tarde]),
      ).toBe(false);
    });

    it("aceita intervalo que termina exatamente no fim da janela (half-open)", () => {
      // 11:00–12:00 cabe em [08:00, 12:00)
      expect(
        intervaloCabeNaDisponibilidade(11 * 60, 12 * 60, [manha]),
      ).toBe(true);
    });
  });
});
