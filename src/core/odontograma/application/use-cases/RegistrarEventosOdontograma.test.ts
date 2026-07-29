import { describe, expect, it } from "vitest";

import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError } from "@/core/shared/errors";

import { DenteAusenteSemFacesError } from "../../domain/errors";
import { EventoOdontograma } from "../../domain/EventoOdontograma";
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
    expect(ctx.odontogramaRepo.salvarEventosCalls).toHaveLength(1);
    expect(
      await ctx.odontogramaRepo.listarPorProntuario(
        ctx.clinicaId,
        ctx.prontuario.id,
      ),
    ).toHaveLength(2);
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

  it("dente ausente em consulta anterior bloqueia face numa chamada isolada futura", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    seedDenteAusenteConsultaAnterior(ctx.odontogramaRepo, {
      profissionalId: ctx.profissional.id,
    });
    const tamanhoHistorico = (
      await ctx.odontogramaRepo.listarPorProntuario(
        ctx.clinicaId,
        ctx.prontuario.id,
      )
    ).length;
    expect(tamanhoHistorico).toBe(1);

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
            numeroDente: 26,
            nivel: "face",
            face: "oclusal",
            estadoNovo: "cariado",
          },
        ],
      }),
    ).rejects.toThrow(DenteAusenteSemFacesError);

    // Atomicidade: caso de uso rejeita antes de persistir — nenhuma chamada ao repo
    expect(ctx.odontogramaRepo.salvarEventosCalls).toHaveLength(0);
    expect(
      await ctx.odontogramaRepo.listarPorProntuario(
        ctx.clinicaId,
        ctx.prontuario.id,
      ),
    ).toHaveLength(tamanhoHistorico);
  });

  it("lote com um evento inválido (dente ausente) não persiste nenhum evento do lote", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    seedDenteAusenteConsultaAnterior(ctx.odontogramaRepo, {
      profissionalId: ctx.profissional.id,
    });

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
            face: "mesial",
            estadoNovo: "higido",
          },
          {
            numeroDente: 26,
            nivel: "face",
            face: "distal",
            estadoNovo: "cariado",
          },
        ],
      }),
    ).rejects.toThrow(DenteAusenteSemFacesError);

    // Tudo-ou-nada: o evento válido do lote também NÃO foi persistido
    expect(ctx.odontogramaRepo.salvarEventosCalls).toHaveLength(0);
    const historico = await ctx.odontogramaRepo.listarPorProntuario(
      ctx.clinicaId,
      ctx.prontuario.id,
    );
    expect(historico).toHaveLength(1);
    expect(historico[0]!.id).toBe("ev-ausente-anterior");
    expect(historico.some((e) => e.numeroDente === 11)).toBe(false);
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
