import { describe, expect, it } from "vitest";

import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError } from "@/core/shared/errors";

import { EstadoDenteInteiroConflitanteError } from "../../domain/errors";
import { EventoOdontograma } from "../../domain/EventoOdontograma";
import { projetarOdontogramaVigente } from "../../domain/OdontogramaVigente";
import {
  seedContextoOdontograma,
  seedDenteAusenteConsultaAnterior,
} from "./helpers-test";
import { RegistrarEventosOdontograma } from "./RegistrarEventosOdontograma";

describe("RegistrarEventosOdontograma", () => {
  it("dentista registra eventos append-only e recebe sequencia do repositório", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const sut = new RegistrarEventosOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const eventos = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      eventos: [
        {
          numeroDente: 11,
          nivel: "face",
          face: "oclusal",
          estadoNovo: "cariado",
        },
        {
          numeroDente: 51,
          nivel: "face",
          face: "mesial",
          estadoNovo: "higido",
        },
      ],
    });

    expect(eventos).toHaveLength(2);
    expect(eventos.every((e) => e.profissionalId === ctx.profissional.id)).toBe(
      true,
    );
    expect(eventos.every((e) => e.sequencia != null)).toBe(true);
    expect(eventos[0]!.sequencia!).toBeLessThan(eventos[1]!.sequencia!);
    expect(ctx.odontogramaRepo.salvarEventosCalls).toHaveLength(1);
    expect(ctx.odontogramaRepo.salvarEventosCalls[0]!.map((e) => e.id)).toEqual(
      eventos.map((e) => e.id),
    );
    expect(
      await ctx.odontogramaRepo.listarPorProntuario(
        ctx.clinicaId,
        ctx.prontuario.id,
      ),
    ).toHaveLength(2);
  });

  it("lote implante→restaurado no mesmo dente: face encerra dente inteiro (ordem do array = sequencia)", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const sut = new RegistrarEventosOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const persistidos = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      eventos: [
        {
          numeroDente: 23,
          nivel: "dente",
          estadoNovo: "implante",
        },
        {
          numeroDente: 23,
          nivel: "face",
          face: "oclusal",
          estadoNovo: "restaurado",
        },
      ],
    });

    expect(persistidos.map((e) => e.sequencia)).toEqual([1, 2]);

    const vigente = projetarOdontogramaVigente(
      ctx.prontuario.id,
      ctx.clinicaId,
      persistidos,
    );
    const dente = vigente.dentes.find((d) => d.numeroDente === 23);
    expect(dente?.estadoDente).toBeNull();
    expect(dente?.faces.find((f) => f.face === "oclusal")?.estado).toBe(
      "restaurado",
    );
  });

  it("lote restaurado→implante no mesmo dente: implante vigente e faces limpas", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const sut = new RegistrarEventosOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const persistidos = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      eventos: [
        {
          numeroDente: 24,
          nivel: "face",
          face: "oclusal",
          estadoNovo: "restaurado",
        },
        {
          numeroDente: 24,
          nivel: "dente",
          estadoNovo: "implante",
        },
      ],
    });

    expect(persistidos.map((e) => e.sequencia)).toEqual([1, 2]);

    const vigente = projetarOdontogramaVigente(
      ctx.prontuario.id,
      ctx.clinicaId,
      persistidos,
    );
    const dente = vigente.dentes.find((d) => d.numeroDente === 24);
    expect(dente?.estadoDente).toBe("implante");
    expect(dente?.faces).toEqual([]);
  });

  it("usa profissionalId da sessão, não um id arbitrário no input", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const sut = new RegistrarEventosOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const [evento] = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      eventos: [
        {
          numeroDente: 21,
          nivel: "face",
          face: "vestibular",
          estadoNovo: "restaurado",
        },
      ],
    });

    expect(evento!.profissionalId).toBe(ctx.profissional.id);
    expect(evento!.profissionalId).not.toBe("prof-arbitrario");
  });

  it("face após ausente_extraido vigente encerra o dente inteiro (não rejeita)", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    seedDenteAusenteConsultaAnterior(ctx.odontogramaRepo, {
      profissionalId: ctx.profissional.id,
    });

    const sut = new RegistrarEventosOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const persistidos = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      eventos: [
        {
          numeroDente: 26,
          nivel: "face",
          face: "oclusal",
          estadoNovo: "cariado",
        },
      ],
    });

    const historico = await ctx.odontogramaRepo.listarPorProntuario(
      ctx.clinicaId,
      ctx.prontuario.id,
    );
    const vigente = projetarOdontogramaVigente(
      ctx.prontuario.id,
      ctx.clinicaId,
      historico,
    );
    const dente = vigente.dentes.find((d) => d.numeroDente === 26);
    expect(persistidos).toHaveLength(1);
    expect(dente?.estadoDente).toBeNull();
    expect(dente?.faces.find((f) => f.face === "oclusal")?.estado).toBe(
      "cariado",
    );
  });

  it("dois dente-inteiro diferentes no mesmo dente no lote → EstadoDenteInteiroConflitanteError e nada persiste", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const sut = new RegistrarEventosOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        eventos: [
          {
            numeroDente: 27,
            nivel: "dente",
            estadoNovo: "implante",
          },
          {
            numeroDente: 27,
            nivel: "dente",
            estadoNovo: "indicado_extracao",
          },
        ],
      }),
    ).rejects.toThrow(EstadoDenteInteiroConflitanteError);

    expect(ctx.odontogramaRepo.salvarEventosCalls).toHaveLength(0);
    expect(
      await ctx.odontogramaRepo.listarPorProntuario(
        ctx.clinicaId,
        ctx.prontuario.id,
      ),
    ).toHaveLength(0);
  });

  it("fake garante atomicidade se a escrita falhar no meio do lote", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const lote = [
      EventoOdontograma.criarFace({
        id: "ev-a",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 11,
        face: "oclusal",
        estadoNovo: "higido",
        profissionalId: ctx.profissional.id,
      }),
      EventoOdontograma.criarFace({
        id: "ev-b",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 12,
        face: "mesial",
        estadoNovo: "cariado",
        profissionalId: ctx.profissional.id,
      }),
    ];

    ctx.odontogramaRepo.falharProximoSalvar = true;

    await expect(ctx.odontogramaRepo.salvarEventos(lote)).rejects.toThrow(
      /Falha simulada/,
    );

    expect(ctx.odontogramaRepo.items.size).toBe(0);
    expect(ctx.odontogramaRepo.salvarEventosCalls).toHaveLength(1);
  });

  it.each(["admin", "dentista"] as const)(
    "%s pode registrar eventos",
    async (papel) => {
      const ctx = await seedContextoOdontograma(papel);
      const sut = new RegistrarEventosOdontograma(
        ctx.odontogramaRepo,
        ctx.prontuarioRepo,
        ctx.profissionalRepo,
      );

      const eventos = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        eventos: [
          {
            numeroDente: 12,
            nivel: "face",
            face: "lingual_palatina",
            estadoNovo: "selante",
          },
        ],
      });

      expect(eventos).toHaveLength(1);
    },
  );

  it("recepção não registra eventos", async () => {
    const ctx = await seedContextoOdontograma("recepcao");
    const sut = new RegistrarEventosOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        eventos: [
          {
            numeroDente: 11,
            nivel: "face",
            face: "oclusal",
            estadoNovo: "higido",
          },
        ],
      }),
    ).rejects.toThrow(PermissaoNegadaError);

    expect(ctx.odontogramaRepo.salvarEventosCalls).toHaveLength(0);
  });

  it("falha se o prontuário não existir na clínica", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const sut = new RegistrarEventosOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: "pront-inexistente",
        eventos: [
          {
            numeroDente: 11,
            nivel: "face",
            face: "oclusal",
            estadoNovo: "higido",
          },
        ],
      }),
    ).rejects.toThrow(ProntuarioNaoEncontradoError);

    expect(ctx.odontogramaRepo.salvarEventosCalls).toHaveLength(0);
  });
});
