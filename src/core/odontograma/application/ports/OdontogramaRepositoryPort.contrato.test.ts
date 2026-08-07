import { describe, expect, it } from "vitest";

import { EventoOdontograma } from "../../domain/EventoOdontograma";
import {
  assertLoteNaoViolaEstadoDenteInteiro,
  projetarOdontogramaVigente,
} from "../../domain/OdontogramaVigente";
import { FakeOdontogramaRepository } from "../test-doubles/fakes";

const clinicaId = "clinica-contrato";
const prontuarioId = "pront-contrato";
const profissionalId = "prof-contrato";

/**
 * Contrato de `OdontogramaRepositoryPort.salvarEventos` (spec 004):
 * ordem do array ≡ ordem monotônica de `sequencia`. O fake espelha o
 * adapter; insert paralelo / reordenação quebram o alinhamento com
 * `assertLoteNaoViolaEstadoDenteInteiro` e a projeção vigente.
 */
describe("OdontogramaRepositoryPort.salvarEventos (contrato / fake)", () => {
  it("atribui sequencia estritamente crescente na ordem do array de entrada", async () => {
    const repo = new FakeOdontogramaRepository();
    const lote = [
      EventoOdontograma.criarDente({
        id: "ev-a",
        clinicaId,
        prontuarioId,
        numeroDente: 11,
        estadoNovo: "implante",
        profissionalId,
      }),
      EventoOdontograma.criarFace({
        id: "ev-b",
        clinicaId,
        prontuarioId,
        numeroDente: 11,
        face: "oclusal",
        estadoNovo: "restaurado",
        profissionalId,
      }),
      EventoOdontograma.criarFace({
        id: "ev-c",
        clinicaId,
        prontuarioId,
        numeroDente: 12,
        face: "mesial",
        estadoNovo: "cariado",
        profissionalId,
      }),
    ];

    const persistidos = await repo.salvarEventos(lote);

    expect(persistidos.map((e) => e.id)).toEqual(["ev-a", "ev-b", "ev-c"]);
    expect(persistidos.map((e) => e.sequencia)).toEqual([1, 2, 3]);
    for (let i = 1; i < persistidos.length; i++) {
      expect(persistidos[i]!.sequencia!).toBeGreaterThan(
        persistidos[i - 1]!.sequencia!,
      );
    }
  });

  it("assert (ordem do array) e projeção (sequencia) concordam após salvarEventos", async () => {
    const repo = new FakeOdontogramaRepository();
    const vigenteVazio = projetarOdontogramaVigente(
      prontuarioId,
      clinicaId,
      [],
    );

    const implanteDepoisRestaurado = [
      EventoOdontograma.criarDente({
        id: "lote-implante",
        clinicaId,
        prontuarioId,
        numeroDente: 23,
        estadoNovo: "implante",
        profissionalId,
      }),
      EventoOdontograma.criarFace({
        id: "lote-restaurado",
        clinicaId,
        prontuarioId,
        numeroDente: 23,
        face: "oclusal",
        estadoNovo: "restaurado",
        profissionalId,
      }),
    ];

    expect(() =>
      assertLoteNaoViolaEstadoDenteInteiro(
        vigenteVazio,
        implanteDepoisRestaurado,
      ),
    ).not.toThrow();

    const persistidos = await repo.salvarEventos(implanteDepoisRestaurado);
    const vigente = projetarOdontogramaVigente(
      prontuarioId,
      clinicaId,
      persistidos,
    );
    const dente = vigente.dentes.find((d) => d.numeroDente === 23);

    expect(dente?.estadoDente).toBeNull();
    expect(dente?.faces.find((f) => f.face === "oclusal")?.estado).toBe(
      "restaurado",
    );
  });

  it("ordem inversa no array (restaurado→implante) também alinha assert e projeção", async () => {
    const repo = new FakeOdontogramaRepository();
    const vigenteVazio = projetarOdontogramaVigente(
      prontuarioId,
      clinicaId,
      [],
    );

    const restauradoDepoisImplante = [
      EventoOdontograma.criarFace({
        id: "lote-face",
        clinicaId,
        prontuarioId,
        numeroDente: 24,
        face: "oclusal",
        estadoNovo: "restaurado",
        profissionalId,
      }),
      EventoOdontograma.criarDente({
        id: "lote-dente",
        clinicaId,
        prontuarioId,
        numeroDente: 24,
        estadoNovo: "implante",
        profissionalId,
      }),
    ];

    expect(() =>
      assertLoteNaoViolaEstadoDenteInteiro(
        vigenteVazio,
        restauradoDepoisImplante,
      ),
    ).not.toThrow();

    const persistidos = await repo.salvarEventos(restauradoDepoisImplante);
    expect(persistidos.map((e) => e.sequencia)).toEqual([1, 2]);

    const vigente = projetarOdontogramaVigente(
      prontuarioId,
      clinicaId,
      persistidos,
    );
    const dente = vigente.dentes.find((d) => d.numeroDente === 24);

    expect(dente?.estadoDente).toBe("implante");
    expect(dente?.faces).toEqual([]);
  });
});
