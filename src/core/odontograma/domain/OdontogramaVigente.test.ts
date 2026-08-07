import { describe, expect, it } from "vitest";

import { EstadoDenteInteiroConflitanteError } from "./errors";
import { EventoOdontograma } from "./EventoOdontograma";
import {
  assertLoteNaoViolaEstadoDenteInteiro,
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
  estadoNovo:
    | "ausente_extraido"
    | "implante"
    | "indicado_extracao"
    | "protese_coroa"
    | "tratamento_endodontico";
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

    it("histórico pré-correção com vários dente-inteiro conflitantes no mesmo dente: lê sem erro e o mais recente vence", () => {
      // Simula dado legado (ex. dente 23 com 5 estados de dente inteiro
      // gravados antes da regra de conflito). Array propositalmente fora
      // de ordem — a projeção deve seguir sequencia, não a ordem do array.
      const instante = new Date("2026-03-01T15:00:00.000Z");
      const historicoLegadoEmbaralhado = [
        dentePersistido({
          id: "d23-protese",
          numeroDente: 23,
          estadoNovo: "protese_coroa",
          registradoEm: instante,
          sequencia: 4,
        }),
        dentePersistido({
          id: "d23-ausente",
          numeroDente: 23,
          estadoNovo: "ausente_extraido",
          registradoEm: instante,
          sequencia: 1,
        }),
        dentePersistido({
          id: "d23-endodontico",
          numeroDente: 23,
          estadoNovo: "tratamento_endodontico",
          registradoEm: instante,
          sequencia: 5,
        }),
        dentePersistido({
          id: "d23-implante",
          numeroDente: 23,
          estadoNovo: "implante",
          registradoEm: instante,
          sequencia: 2,
        }),
        dentePersistido({
          id: "d23-indicado",
          numeroDente: 23,
          estadoNovo: "indicado_extracao",
          registradoEm: instante,
          sequencia: 3,
        }),
      ];

      expect(() =>
        projetarOdontogramaVigente(
          prontuarioId,
          clinicaId,
          historicoLegadoEmbaralhado,
        ),
      ).not.toThrow();

      const vigente = projetarOdontogramaVigente(
        prontuarioId,
        clinicaId,
        historicoLegadoEmbaralhado,
      );
      const dente = vigente.dentes.find((d) => d.numeroDente === 23);

      expect(dente?.estadoDente).toBe("tratamento_endodontico");
      expect(dente?.eventoDenteId).toBe("d23-endodontico");
      expect(dente?.sequenciaDente).toBe(5);
      expect(dente?.faces).toEqual([]);
    });

    it("lote implante→restaurado (sequencia): encerra dente inteiro e face vigora", () => {
      const instante = new Date("2026-04-01T10:00:00.000Z");
      const vigente = projetarOdontogramaVigente(prontuarioId, clinicaId, [
        dentePersistido({
          id: "ev-implante",
          numeroDente: 25,
          estadoNovo: "implante",
          registradoEm: instante,
          sequencia: 10,
        }),
        facePersistida({
          id: "ev-restaurado",
          numeroDente: 25,
          face: "oclusal",
          estadoNovo: "restaurado",
          registradoEm: instante,
          sequencia: 11,
        }),
      ]);

      const dente = vigente.dentes.find((d) => d.numeroDente === 25);
      expect(dente?.estadoDente).toBeNull();
      expect(dente?.faces).toHaveLength(1);
      expect(dente?.faces[0]?.estado).toBe("restaurado");
    });

    it("lote restaurado→implante (sequencia): implante vigente e faces limpas", () => {
      const instante = new Date("2026-04-01T10:00:00.000Z");
      const vigente = projetarOdontogramaVigente(prontuarioId, clinicaId, [
        facePersistida({
          id: "ev-restaurado",
          numeroDente: 26,
          face: "oclusal",
          estadoNovo: "restaurado",
          registradoEm: instante,
          sequencia: 20,
        }),
        dentePersistido({
          id: "ev-implante",
          numeroDente: 26,
          estadoNovo: "implante",
          registradoEm: instante,
          sequencia: 21,
        }),
      ]);

      const dente = vigente.dentes.find((d) => d.numeroDente === 26);
      expect(dente?.estadoDente).toBe("implante");
      expect(dente?.faces).toEqual([]);
    });
  });

  describe("assertLoteNaoViolaEstadoDenteInteiro", () => {
    it("permite face após dente inteiro no mesmo lote (encerra — ordem do array)", () => {
      const vigente = projetarOdontogramaVigente(prontuarioId, clinicaId, []);
      const marcarImplante = EventoOdontograma.criarDente({
        id: "ev-a",
        clinicaId,
        prontuarioId,
        numeroDente: 36,
        estadoNovo: "implante",
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
        assertLoteNaoViolaEstadoDenteInteiro(vigente, [
          marcarImplante,
          faceDepois,
        ]),
      ).not.toThrow();
    });

    it("rejeita dois dente-inteiro diferentes no mesmo dente no lote", () => {
      const vigente = projetarOdontogramaVigente(prontuarioId, clinicaId, []);
      const implante = EventoOdontograma.criarDente({
        id: "ev-1",
        clinicaId,
        prontuarioId,
        numeroDente: 37,
        estadoNovo: "implante",
        profissionalId,
      });
      const indicado = EventoOdontograma.criarDente({
        id: "ev-2",
        clinicaId,
        prontuarioId,
        numeroDente: 37,
        estadoNovo: "indicado_extracao",
        profissionalId,
      });

      expect(() =>
        assertLoteNaoViolaEstadoDenteInteiro(vigente, [implante, indicado]),
      ).toThrow(EstadoDenteInteiroConflitanteError);
    });

    it("permite face quando o dente não tem dente inteiro vigente", () => {
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
        assertLoteNaoViolaEstadoDenteInteiro(vigente, [face]),
      ).not.toThrow();
    });
  });
});
