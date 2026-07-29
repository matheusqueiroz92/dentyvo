import { describe, expect, it } from "vitest";

import { EstadoOdontogramaInvalidoError } from "./errors";
import {
  ESTADOS_ODONTOGRAMA,
  ehEstadoOdontograma,
  type EstadoOdontograma,
} from "./EstadoOdontograma";
import { EventoOdontograma } from "./EventoOdontograma";

describe("EstadoOdontograma (catálogo)", () => {
  it("aceita os 10 estados definidos no catálogo inicial", () => {
    expect(ESTADOS_ODONTOGRAMA).toHaveLength(10);
    for (const estado of ESTADOS_ODONTOGRAMA) {
      expect(ehEstadoOdontograma(estado)).toBe(true);
    }
  });

  it.each([
    "higido",
    "cariado",
    "restaurado",
    "indicado_extracao",
    "protese_coroa",
    "implante",
    "fraturado",
    "tratamento_endodontico",
    "selante",
  ] as const)(
    "permite registrar estado de face %s",
    (estado: EstadoOdontograma) => {
      const evento = EventoOdontograma.criarFace({
        id: `ev-${estado}`,
        clinicaId: "clinica-1",
        prontuarioId: "pront-1",
        numeroDente: 11,
        face: "oclusal",
        estadoNovo: estado,
        profissionalId: "prof-1",
      });
      expect(evento.estadoNovo).toBe(estado);
    },
  );

  it("permite ausente_extraido apenas no nível do dente", () => {
    const evento = EventoOdontograma.criarDente({
      id: "ev-ausente",
      clinicaId: "clinica-1",
      prontuarioId: "pront-1",
      numeroDente: 16,
      estadoNovo: "ausente_extraido",
      profissionalId: "prof-1",
    });
    expect(evento.estadoNovo).toBe("ausente_extraido");
    expect(evento.nivel).toBe("dente");
    expect(evento.face).toBeNull();
  });

  it("rejeita valor fora do enum de estados", () => {
    expect(ehEstadoOdontograma("invalido")).toBe(false);
    expect(() =>
      EventoOdontograma.criarFace({
        id: "ev-x",
        clinicaId: "clinica-1",
        prontuarioId: "pront-1",
        numeroDente: 11,
        face: "mesial",
        estadoNovo: "estado_inventado" as EstadoOdontograma,
        profissionalId: "prof-1",
      }),
    ).toThrow(EstadoOdontogramaInvalidoError);
  });
});
