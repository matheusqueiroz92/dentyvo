import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { Evolucao } from "../../domain/Evolucao";
import { ObterEvolucoesDoProntuario } from "./ObterEvolucoesDoProntuario";
import { seedProntuarioExistente } from "./helpers-test";

describe("ObterEvolucoesDoProntuario", () => {
  it("lista evoluções do prontuário sem registrar auditoria de listagem", async () => {
    const ctx = await seedProntuarioExistente("dentista");
    await ctx.evolucaoRepo.salvar(
      Evolucao.criarRegistro({
        id: "evo-1",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        profissionalId: ctx.profissional.id,
        descricao: "Primeira evolução",
      }),
    );

    const sut = new ObterEvolucoesDoProntuario(
      ctx.evolucaoRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    const evolucoes = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
    });

    expect(evolucoes).toHaveLength(1);
    expect(ctx.auditoria.eventos).toHaveLength(0);
  });

  it("recepção não obtém evoluções", async () => {
    const ctx = await seedProntuarioExistente("recepcao");
    const sut = new ObterEvolucoesDoProntuario(
      ctx.evolucaoRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it("isola por tenant: clínica distinta não lista evoluções", async () => {
    const ctx = await seedProntuarioExistente("admin");
    const sut = new ObterEvolucoesDoProntuario(
      ctx.evolucaoRepo,
      ctx.prontuarioRepo,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
