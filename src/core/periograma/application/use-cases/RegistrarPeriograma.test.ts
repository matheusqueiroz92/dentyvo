import { describe, expect, it } from "vitest";

import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { FakePeriogramaRepository } from "../test-doubles/fakes";
import * as useCases from "./index";
import { denteMolarParcial, seedContextoPeriograma } from "./helpers-test";
import { RegistrarPeriograma } from "./RegistrarPeriograma";

describe("RegistrarPeriograma", () => {
  it("dentista registra periograma imutável com preenchimento parcial", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const sut = new RegistrarPeriograma(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const periograma = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      tipo: "exame_inicial",
      dentes: [denteMolarParcial()],
    });

    expect(periograma.tipo).toBe("exame_inicial");
    expect(periograma.profissionalId).toBe(ctx.profissional.id);
    expect(periograma.dentes).toHaveLength(1);
    expect(periograma.dentes[0]?.pontos.length).toBeLessThan(6);
    expect(periograma.dentes[0]?.pontos[0]?.margemGengival).toBe(-1);
    expect(
      await ctx.periogramaRepo.buscarPorId(ctx.clinicaId, periograma.id),
    ).not.toBeNull();
  });

  it("usa profissionalId da sessão, não um id arbitrário", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const sut = new RegistrarPeriograma(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const periograma = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      tipo: "exame_inicial",
      dentes: [denteMolarParcial()],
    });

    expect(periograma.profissionalId).toBe(ctx.profissional.id);
    expect(periograma.profissionalId).not.toBe("prof-arbitrario");
  });

  it("correção cria novo exame reavaliacao sem alterar o anterior", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const sut = new RegistrarPeriograma(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const inicial = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      tipo: "exame_inicial",
      dentes: [denteMolarParcial({ mobilidade: 1 })],
    });

    const reavaliacao = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      tipo: "reavaliacao",
      dentes: [denteMolarParcial({ mobilidade: 2 })],
    });

    expect(reavaliacao.id).not.toBe(inicial.id);
    expect(reavaliacao.tipo).toBe("reavaliacao");
    expect(
      (await ctx.periogramaRepo.buscarPorId(ctx.clinicaId, inicial.id))
        ?.dentes[0]?.mobilidade,
    ).toBe(1);
    expect(
      (await ctx.periogramaRepo.buscarPorId(ctx.clinicaId, reavaliacao.id))
        ?.dentes[0]?.mobilidade,
    ).toBe(2);
  });

  it("não há caso de uso nem API de edição — só criação/append", () => {
    const exportados = Object.keys(useCases);
    expect(exportados.some((k) => /editar|atualizar|update/i.test(k))).toBe(
      false,
    );

    const metodosRepo = Object.getOwnPropertyNames(
      FakePeriogramaRepository.prototype,
    ).filter((m) => m !== "constructor");
    expect(metodosRepo.sort()).toEqual(
      ["buscarPorId", "listarPorProntuario", "salvar"].sort(),
    );
    expect(metodosRepo.some((m) => /atualizar|editar|update/i.test(m))).toBe(
      false,
    );
  });

  it.each(["admin", "dentista"] as const)(
    "%s pode registrar periograma",
    async (papel) => {
      const ctx = await seedContextoPeriograma(papel);
      const sut = new RegistrarPeriograma(
        ctx.periogramaRepo,
        ctx.prontuarioRepo,
        ctx.profissionalRepo,
      );

      const periograma = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        tipo: "exame_inicial",
        dentes: [denteMolarParcial()],
      });

      expect(periograma.id).toBeTruthy();
    },
  );

  it("recepção não registra periograma", async () => {
    const ctx = await seedContextoPeriograma("recepcao");
    const sut = new RegistrarPeriograma(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        tipo: "exame_inicial",
        dentes: [denteMolarParcial()],
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("falha quando prontuário não existe na clínica", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const sut = new RegistrarPeriograma(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: "pront-inexistente",
        tipo: "exame_inicial",
        dentes: [denteMolarParcial()],
      }),
    ).rejects.toBeInstanceOf(ProntuarioNaoEncontradoError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoPeriograma("dentista");
    const sut = new RegistrarPeriograma(
      ctx.periogramaRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        tipo: "exame_inicial",
        dentes: [denteMolarParcial()],
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
