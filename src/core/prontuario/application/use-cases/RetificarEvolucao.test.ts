import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { Evolucao } from "../../domain/Evolucao";
import { EvolucaoJaRetificadaError } from "../../domain/errors";
import { RetificarEvolucao } from "./RetificarEvolucao";
import { seedProntuarioExistente } from "./helpers-test";

describe("RetificarEvolucao", () => {
  it("retifica evolução original uma única vez", async () => {
    const ctx = await seedProntuarioExistente("dentista");
    const original = Evolucao.criarRegistro({
      id: "evo-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      descricao: "Texto com erro",
    });
    await ctx.evolucaoRepo.salvar(original);

    const sut = new RetificarEvolucao(
      ctx.evolucaoRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    const retificacao = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      evolucaoId: original.id,
      descricao: "Texto corrigido",
      motivoRetificacao: "Erro de digitação",
    });

    expect(retificacao.tipo).toBe("retificacao");
    expect(retificacao.evolucaoRetificadaId).toBe(original.id);
    expect(
      await ctx.evolucaoRepo.buscarPorId(ctx.clinicaId, original.id),
    ).not.toBeNull();
    expect(ctx.auditoria.eventos.some((e) => e.acao === "escrita")).toBe(
      true,
    );
  });

  it("falha ao tentar retificar uma evolução já retificada", async () => {
    const ctx = await seedProntuarioExistente("admin");
    const original = Evolucao.criarRegistro({
      id: "evo-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      descricao: "Original",
    });
    await ctx.evolucaoRepo.salvar(original);

    const jaRetificada = Evolucao.criarRetificacao({
      id: "evo-2",
      original,
      profissionalId: ctx.profissional.id,
      descricao: "Primeira retificação",
      motivoRetificacao: "Correção",
    });
    await ctx.evolucaoRepo.salvar(jaRetificada);

    const sut = new RetificarEvolucao(
      ctx.evolucaoRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        evolucaoId: original.id,
        descricao: "Segunda tentativa",
        motivoRetificacao: "Outra correção",
      }),
    ).rejects.toBeInstanceOf(EvolucaoJaRetificadaError);
  });

  it("recepção não retifica evolução", async () => {
    const ctx = await seedProntuarioExistente("recepcao");
    const original = Evolucao.criarRegistro({
      id: "evo-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      descricao: "Original",
    });
    await ctx.evolucaoRepo.salvar(original);

    const sut = new RetificarEvolucao(
      ctx.evolucaoRepo,
      ctx.profissionalRepo,
      ctx.auditoria,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        evolucaoId: original.id,
        descricao: "Tentativa",
        motivoRetificacao: "Motivo",
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });
});
