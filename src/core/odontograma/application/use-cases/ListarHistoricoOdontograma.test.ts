import { describe, expect, it } from "vitest";

import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError } from "@/core/shared/errors";

import { EventoOdontograma } from "../../domain/EventoOdontograma";
import { seedContextoOdontograma } from "./helpers-test";
import { ListarHistoricoOdontograma } from "./ListarHistoricoOdontograma";

describe("ListarHistoricoOdontograma", () => {
  it("lista eventos ordenados por registradoEm e sequencia", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const instante = new Date("2026-01-01T12:00:00.000Z");
    ctx.odontogramaRepo.seed([
      EventoOdontograma.reconstituir({
        id: "zzz-maior-id",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 11,
        nivel: "face",
        face: "oclusal",
        estadoNovo: "higido",
        procedimentoId: null,
        registradoEm: instante,
        profissionalId: ctx.profissional.id,
        sequencia: 1,
      }),
      EventoOdontograma.reconstituir({
        id: "aaa-menor-id",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 11,
        nivel: "face",
        face: "oclusal",
        estadoNovo: "cariado",
        procedimentoId: null,
        registradoEm: instante,
        profissionalId: ctx.profissional.id,
        sequencia: 2,
      }),
      EventoOdontograma.reconstituir({
        id: "ev-mais-cedo",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 12,
        nivel: "face",
        face: "mesial",
        estadoNovo: "selante",
        procedimentoId: null,
        registradoEm: new Date("2026-01-01T10:00:00.000Z"),
        profissionalId: ctx.profissional.id,
        sequencia: 3,
      }),
    ]);

    const sut = new ListarHistoricoOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const historico = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    expect(historico.map((e) => e.id)).toEqual([
      "ev-mais-cedo",
      "zzz-maior-id",
      "aaa-menor-id",
    ]);
    expect(historico.map((e) => e.sequencia)).toEqual([3, 1, 2]);
  });

  it("filtra por numeroDente e face", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    ctx.odontogramaRepo.seed([
      EventoOdontograma.reconstituir({
        id: "ev-11-oclusal",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 11,
        nivel: "face",
        face: "oclusal",
        estadoNovo: "cariado",
        procedimentoId: null,
        registradoEm: new Date("2026-01-01T10:00:00.000Z"),
        profissionalId: ctx.profissional.id,
        sequencia: 1,
      }),
      EventoOdontograma.reconstituir({
        id: "ev-11-mesial",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 11,
        nivel: "face",
        face: "mesial",
        estadoNovo: "higido",
        procedimentoId: null,
        registradoEm: new Date("2026-01-01T11:00:00.000Z"),
        profissionalId: ctx.profissional.id,
        sequencia: 2,
      }),
      EventoOdontograma.reconstituir({
        id: "ev-21",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 21,
        nivel: "face",
        face: "oclusal",
        estadoNovo: "restaurado",
        procedimentoId: null,
        registradoEm: new Date("2026-01-01T12:00:00.000Z"),
        profissionalId: ctx.profissional.id,
        sequencia: 3,
      }),
    ]);

    const sut = new ListarHistoricoOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const filtrado = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      filtros: { numeroDente: 11, face: "oclusal" },
    });

    expect(filtrado).toHaveLength(1);
    expect(filtrado[0]!.id).toBe("ev-11-oclusal");
  });

  it.each(["admin", "dentista"] as const)(
    "%s pode listar histórico",
    async (papel) => {
      const ctx = await seedContextoOdontograma(papel);
      const sut = new ListarHistoricoOdontograma(
        ctx.odontogramaRepo,
        ctx.prontuarioRepo,
        ctx.profissionalRepo,
      );

      const historico = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      });

      expect(historico).toEqual([]);
    },
  );

  it("recepção não lista histórico", async () => {
    const ctx = await seedContextoOdontograma("recepcao");
    const sut = new ListarHistoricoOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      }),
    ).rejects.toThrow(PermissaoNegadaError);
  });

  it("falha se o prontuário não existir", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const sut = new ListarHistoricoOdontograma(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: "pront-inexistente",
      }),
    ).rejects.toThrow(ProntuarioNaoEncontradoError);
  });
});
