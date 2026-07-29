import { describe, expect, it } from "vitest";

import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError } from "@/core/shared/errors";

import { EventoOdontograma } from "../../domain/EventoOdontograma";
import { seedContextoOdontograma } from "./helpers-test";
import { ConsultarOdontogramaVigente } from "./ConsultarOdontogramaVigente";

describe("ConsultarOdontogramaVigente", () => {
  it("projeta o estado vigente a partir do histórico append-only", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const t1 = new Date("2026-01-01T10:00:00.000Z");
    const t2 = new Date("2026-01-02T10:00:00.000Z");
    ctx.odontogramaRepo.seed([
      EventoOdontograma.reconstituir({
        id: "ev-1",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 11,
        nivel: "face",
        face: "oclusal",
        estadoNovo: "cariado",
        procedimentoId: null,
        registradoEm: t1,
        profissionalId: ctx.profissional.id,
        sequencia: 1,
      }),
      EventoOdontograma.reconstituir({
        id: "ev-2",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 11,
        nivel: "face",
        face: "oclusal",
        estadoNovo: "restaurado",
        procedimentoId: null,
        registradoEm: t2,
        profissionalId: ctx.profissional.id,
        sequencia: 2,
      }),
    ]);

    const sut = new ConsultarOdontogramaVigente(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const vigente = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    expect(vigente.prontuarioId).toBe(ctx.prontuario.id);
    const dente = vigente.dentes.find((d) => d.numeroDente === 11);
    const oclusal = dente?.faces.find((f) => f.face === "oclusal");
    expect(oclusal?.estado).toBe("restaurado");
    expect(oclusal?.eventoId).toBe("ev-2");
  });

  it("com mesmo registradoEm, vigente segue sequencia e não o id", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    const instante = new Date("2026-01-01T12:00:00.000Z");
    ctx.odontogramaRepo.seed([
      EventoOdontograma.reconstituir({
        id: "zzz-maior-id",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 21,
        nivel: "face",
        face: "vestibular",
        estadoNovo: "higido",
        procedimentoId: null,
        registradoEm: instante,
        profissionalId: ctx.profissional.id,
        sequencia: 5,
      }),
      EventoOdontograma.reconstituir({
        id: "aaa-menor-id",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 21,
        nivel: "face",
        face: "vestibular",
        estadoNovo: "fraturado",
        procedimentoId: null,
        registradoEm: instante,
        profissionalId: ctx.profissional.id,
        sequencia: 6,
      }),
    ]);

    const sut = new ConsultarOdontogramaVigente(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const vigente = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    const face = vigente.dentes
      .find((d) => d.numeroDente === 21)
      ?.faces.find((f) => f.face === "vestibular");
    expect(face?.estado).toBe("fraturado");
    expect(face?.eventoId).toBe("aaa-menor-id");
  });

  it("dente ausente omite faces na visão vigente", async () => {
    const ctx = await seedContextoOdontograma("dentista");
    ctx.odontogramaRepo.seed([
      EventoOdontograma.reconstituir({
        id: "ev-face-antiga",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 26,
        nivel: "face",
        face: "oclusal",
        estadoNovo: "cariado",
        procedimentoId: null,
        registradoEm: new Date("2025-12-01T10:00:00.000Z"),
        profissionalId: ctx.profissional.id,
        sequencia: 1,
      }),
      EventoOdontograma.reconstituir({
        id: "ev-ausente",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        numeroDente: 26,
        nivel: "dente",
        face: null,
        estadoNovo: "ausente_extraido",
        procedimentoId: null,
        registradoEm: new Date("2026-01-01T10:00:00.000Z"),
        profissionalId: ctx.profissional.id,
        sequencia: 2,
      }),
    ]);

    const sut = new ConsultarOdontogramaVigente(
      ctx.odontogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const vigente = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    const dente = vigente.dentes.find((d) => d.numeroDente === 26);
    expect(dente?.estadoDente).toBe("ausente_extraido");
    expect(dente?.faces).toEqual([]);
  });

  it.each(["admin", "dentista"] as const)(
    "%s pode consultar o odontograma vigente",
    async (papel) => {
      const ctx = await seedContextoOdontograma(papel);
      const sut = new ConsultarOdontogramaVigente(
        ctx.odontogramaRepo,
        ctx.prontuarioRepo,
        ctx.profissionalRepo,
      );

      const vigente = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      });

      expect(vigente.prontuarioId).toBe(ctx.prontuario.id);
      expect(vigente.dentes).toEqual([]);
    },
  );

  it("recepção não consulta odontograma vigente", async () => {
    const ctx = await seedContextoOdontograma("recepcao");
    const sut = new ConsultarOdontogramaVigente(
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
    const sut = new ConsultarOdontogramaVigente(
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
