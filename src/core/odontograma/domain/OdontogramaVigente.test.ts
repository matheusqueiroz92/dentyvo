import { describe, expect, it } from "vitest";

import { DenteAusenteSemFacesError } from "./errors";
import { EventoOdontograma } from "./EventoOdontograma";
import {
  assertLoteNaoViolaDenteAusente,
  projetarOdontogramaVigente,
} from "./OdontogramaVigente";

const clinicaId = "clinica-1";
const prontuarioId = "pront-1";
const profissionalId = "prof-1";

function facePersistida(input: {
  id: string;
  numeroDente: number;
  face: "vestibular" | "oclusal" | "mesial" | "distal" | "lingual_palatina";
  estadoNovo: "higido" | "cariado" | "restaurado" | "fraturado";
  registradoEm: Date;
  sequencia: number;
}) {
  return EventoOdontograma.reconstituir({
    id: input.id,
    clinicaId,
    prontuarioId,
    numeroDente: input.numeroDente,
    nivel: "face",
    face: input.face,
    estadoNovo: input.estadoNovo,
    procedimentoId: null,
    registradoEm: input.registradoEm,
    profissionalId,
    sequencia: input.sequencia,
  });
}

function dentePersistido(input: {
  id: string;
  numeroDente: number;
  estadoNovo: "ausente_extraido" | "implante" | "higido";
  registradoEm: Date;
  sequencia: number;
}) {
  return EventoOdontograma.reconstituir({
    id: input.id,
    clinicaId,
    prontuarioId,
    numeroDente: input.numeroDente,
    nivel: "dente",
    face: null,
    estadoNovo: input.estadoNovo,
    procedimentoId: null,
    registradoEm: input.registradoEm,
    profissionalId,
    sequencia: input.sequencia,
  });
}

describe("OdontogramaVigente", () => {
  describe("projetarOdontogramaVigente", () => {
    it("projeta o estado atual de cada face a partir do evento mais recente", () => {
      const t1 = new Date("2026-01-01T10:00:00.000Z");
      const t2 = new Date("2026-01-02T10:00:00.000Z");
      const eventos = [
        facePersistida({
          id: "ev-1",
          numeroDente: 11,
          face: "oclusal",
          estadoNovo: "cariado",
          registradoEm: t1,
          sequencia: 1,
        }),
        facePersistida({
          id: "ev-2",
          numeroDente: 11,
          face: "oclusal",
          estadoNovo: "restaurado",
          registradoEm: t2,
          sequencia: 2,
        }),
        facePersistida({
          id: "ev-3",
          numeroDente: 11,
          face: "mesial",
          estadoNovo: "higido",
          registradoEm: t1,
          sequencia: 3,
        }),
      ];

      const vigente = projetarOdontogramaVigente(
        prontuarioId,
        clinicaId,
        eventos,
      );
      const dente = vigente.dentes.find((d) => d.numeroDente === 11);
      expect(dente?.faces).toHaveLength(2);

      const oclusal = dente?.faces.find((f) => f.face === "oclusal");
      expect(oclusal?.estado).toBe("restaurado");
      expect(oclusal?.eventoId).toBe("ev-2");

      const mesial = dente?.faces.find((f) => f.face === "mesial");
      expect(mesial?.estado).toBe("higido");
    });

    it("com mesmo registradoEm, o maior sequencia vence — não o id", () => {
      const instante = new Date("2026-01-01T12:00:00.000Z");
      const vigente = projetarOdontogramaVigente(prontuarioId, clinicaId, [
        facePersistida({
          id: "zzz-maior-id",
          numeroDente: 21,
          face: "vestibular",
          estadoNovo: "higido",
          registradoEm: instante,
          sequencia: 5,
        }),
        facePersistida({
          id: "aaa-menor-id",
          numeroDente: 21,
          face: "vestibular",
          estadoNovo: "cariado",
          registradoEm: instante,
          sequencia: 6,
        }),
      ]);

      const face = vigente.dentes
        .find((d) => d.numeroDente === 21)
        ?.faces.find((f) => f.face === "vestibular");
      expect(face?.estado).toBe("cariado");
      expect(face?.eventoId).toBe("aaa-menor-id");
      expect(face?.sequencia).toBe(6);
    });

    it("dente ausente não expõe faces vigentes (mesmo com histórico de face)", () => {
      const vigente = projetarOdontogramaVigente(prontuarioId, clinicaId, [
        facePersistida({
          id: "ev-face",
          numeroDente: 16,
          face: "oclusal",
          estadoNovo: "cariado",
          registradoEm: new Date("2026-01-01T10:00:00.000Z"),
          sequencia: 1,
        }),
        dentePersistido({
          id: "ev-ausente",
          numeroDente: 16,
          estadoNovo: "ausente_extraido",
          registradoEm: new Date("2026-01-02T10:00:00.000Z"),
          sequencia: 2,
        }),
      ]);

      const dente = vigente.dentes.find((d) => d.numeroDente === 16);
      expect(dente?.estadoDente).toBe("ausente_extraido");
      expect(dente?.faces).toEqual([]);
    });
  });

  describe("assertLoteNaoViolaDenteAusente", () => {
    it("bloqueia evento de face quando o dente já está ausente no histórico persistido (chamada isolada)", () => {
      const vigente = projetarOdontogramaVigente(prontuarioId, clinicaId, [
        dentePersistido({
          id: "ev-consulta-anterior",
          numeroDente: 26,
          estadoNovo: "ausente_extraido",
          registradoEm: new Date("2026-01-01T10:00:00.000Z"),
          sequencia: 1,
        }),
      ]);

      const novoFace = EventoOdontograma.criarFace({
        id: "ev-futuro",
        clinicaId,
        prontuarioId,
        numeroDente: 26,
        face: "oclusal",
        estadoNovo: "cariado",
        profissionalId,
      });

      expect(() =>
        assertLoteNaoViolaDenteAusente(vigente, [novoFace]),
      ).toThrow(DenteAusenteSemFacesError);
    });

    it("bloqueia face no mesmo lote após marcar ausente_extraido", () => {
      const vigente = projetarOdontogramaVigente(prontuarioId, clinicaId, []);
      const marcarAusente = EventoOdontograma.criarDente({
        id: "ev-a",
        clinicaId,
        prontuarioId,
        numeroDente: 36,
        estadoNovo: "ausente_extraido",
        profissionalId,
      });
      const faceDepois = EventoOdontograma.criarFace({
        id: "ev-b",
        clinicaId,
        prontuarioId,
        numeroDente: 36,
        face: "mesial",
        estadoNovo: "higido",
        profissionalId,
      });

      expect(() =>
        assertLoteNaoViolaDenteAusente(vigente, [marcarAusente, faceDepois]),
      ).toThrow(DenteAusenteSemFacesError);
    });

    it("permite evento de face quando o dente não está ausente", () => {
      const vigente = projetarOdontogramaVigente(prontuarioId, clinicaId, []);
      const face = EventoOdontograma.criarFace({
        id: "ev-ok",
        clinicaId,
        prontuarioId,
        numeroDente: 11,
        face: "distal",
        estadoNovo: "selante",
        profissionalId,
      });

      expect(() =>
        assertLoteNaoViolaDenteAusente(vigente, [face]),
      ).not.toThrow();
    });
  });
});
