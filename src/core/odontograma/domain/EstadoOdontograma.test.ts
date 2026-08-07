import { describe, expect, it } from "vitest";

import {
  EstadoIncompativelComNivelError,
  EstadoOdontogramaInvalidoError,
} from "./errors";
import {
  ESTADOS_DENTE_INTEIRO,
  ESTADOS_ODONTOGRAMA,
  ESTADOS_POR_FACE,
  ehEstadoDenteInteiro,
  ehEstadoOdontograma,
  ehEstadoPorFace,
  type EstadoOdontograma,
} from "./EstadoOdontograma";
import { EventoOdontograma } from "./EventoOdontograma";

describe("EstadoOdontograma (catálogo)", () => {
  it("aceita os 10 estados definidos no catálogo inicial", () => {
    expect(ESTADOS_ODONTOGRAMA).toHaveLength(10);
    expect(ESTADOS_POR_FACE).toHaveLength(5);
    expect(ESTADOS_DENTE_INTEIRO).toHaveLength(5);
    for (const estado of ESTADOS_ODONTOGRAMA) {
      expect(ehEstadoOdontograma(estado)).toBe(true);
    }
  });

  it.each([...ESTADOS_POR_FACE])(
    "permite registrar estado de face %s",
    (estado: EstadoOdontograma) => {
      expect(ehEstadoPorFace(estado)).toBe(true);
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
      expect(evento.nivel).toBe("face");
    },
  );

  it.each([...ESTADOS_DENTE_INTEIRO])(
    "permite registrar estado de dente inteiro %s",
    (estado: EstadoOdontograma) => {
      expect(ehEstadoDenteInteiro(estado)).toBe(true);
      const evento = EventoOdontograma.criarDente({
        id: `ev-${estado}`,
        clinicaId: "clinica-1",
        prontuarioId: "pront-1",
        numeroDente: 16,
        estadoNovo: estado,
        profissionalId: "prof-1",
      });
      expect(evento.estadoNovo).toBe(estado);
      expect(evento.nivel).toBe("dente");
      expect(evento.face).toBeNull();
    },
  );

  it("rejeita estado de dente inteiro no nível da face", () => {
    expect(() =>
      EventoOdontograma.criarFace({
        id: "ev-bad",
        clinicaId: "clinica-1",
        prontuarioId: "pront-1",
        numeroDente: 11,
        face: "oclusal",
        estadoNovo: "implante",
        profissionalId: "prof-1",
      }),
    ).toThrow(EstadoIncompativelComNivelError);
  });

  it("rejeita estado por face no nível do dente", () => {
    expect(() =>
      EventoOdontograma.criarDente({
        id: "ev-bad",
        clinicaId: "clinica-1",
        prontuarioId: "pront-1",
        numeroDente: 11,
        estadoNovo: "higido",
        profissionalId: "prof-1",
      }),
    ).toThrow(EstadoIncompativelComNivelError);
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
