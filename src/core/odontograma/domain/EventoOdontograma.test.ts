import { describe, expect, it } from "vitest";

import { EstadoIncompativelComNivelError } from "./errors";
import {
  compararEventos,
  EventoOdontograma,
} from "./EventoOdontograma";

const base = {
  clinicaId: "clinica-1",
  prontuarioId: "pront-1",
  profissionalId: "prof-1",
} as const;

function eventoFacePersistido(input: {
  id: string;
  numeroDente?: number;
  face?: "vestibular" | "oclusal" | "mesial";
  estadoNovo?: "higido" | "cariado" | "restaurado";
  registradoEm: Date;
  sequencia: number;
}) {
  return EventoOdontograma.reconstituir({
    id: input.id,
    ...base,
    numeroDente: input.numeroDente ?? 11,
    nivel: "face",
    face: input.face ?? "oclusal",
    estadoNovo: input.estadoNovo ?? "cariado",
    procedimentoId: null,
    registradoEm: input.registradoEm,
    profissionalId: base.profissionalId,
    sequencia: input.sequencia,
  });
}

describe("EventoOdontograma", () => {
  it("cria evento de face com sequencia null até persistir", () => {
    const evento = EventoOdontograma.criarFace({
      id: "ev-1",
      ...base,
      numeroDente: 21,
      face: "vestibular",
      estadoNovo: "higido",
      profissionalId: base.profissionalId,
    });
    expect(evento.sequencia).toBeNull();
    expect(evento.nivel).toBe("face");
  });

  it("não permite ausente_extraido no nível da face", () => {
    expect(() =>
      EventoOdontograma.criarFace({
        id: "ev-bad",
        ...base,
        numeroDente: 11,
        face: "oclusal",
        estadoNovo: "ausente_extraido",
        profissionalId: base.profissionalId,
      }),
    ).toThrow(EstadoIncompativelComNivelError);
  });

  describe("compararEventos", () => {
    it("ordena primeiro por registradoEm", () => {
      const cedo = eventoFacePersistido({
        id: "zzz-depois-no-id",
        registradoEm: new Date("2026-01-01T10:00:00.000Z"),
        sequencia: 99,
      });
      const tarde = eventoFacePersistido({
        id: "aaa-antes-no-id",
        registradoEm: new Date("2026-01-01T11:00:00.000Z"),
        sequencia: 1,
      });

      expect(compararEventos(cedo, tarde)).toBeLessThan(0);
      expect([tarde, cedo].sort(compararEventos).map((e) => e.id)).toEqual([
        "zzz-depois-no-id",
        "aaa-antes-no-id",
      ]);
    });

    it("com registradoEm idêntico, desempata por sequencia e nunca por id", () => {
      const mesmoInstante = new Date("2026-01-01T12:00:00.000Z");
      const seqMenorIdMaior = eventoFacePersistido({
        id: "zzz-id-lexicograficamente-maior",
        estadoNovo: "higido",
        registradoEm: mesmoInstante,
        sequencia: 10,
      });
      const seqMaiorIdMenor = eventoFacePersistido({
        id: "aaa-id-lexicograficamente-menor",
        estadoNovo: "restaurado",
        registradoEm: mesmoInstante,
        sequencia: 20,
      });

      expect(compararEventos(seqMenorIdMaior, seqMaiorIdMenor)).toBeLessThan(0);

      const ordenados = [seqMaiorIdMenor, seqMenorIdMaior].sort(compararEventos);
      expect(ordenados.map((e) => e.sequencia)).toEqual([10, 20]);
      // Se o desempate fosse por id, "aaa..." viria antes de "zzz..."
      expect(ordenados[0]!.id).toBe("zzz-id-lexicograficamente-maior");
      expect(ordenados[1]!.id).toBe("aaa-id-lexicograficamente-menor");
    });
  });
});
