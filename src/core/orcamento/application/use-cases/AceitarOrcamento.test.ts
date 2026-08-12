import { describe, expect, it } from "vitest";

import { TenantMismatchError } from "@/core/shared/errors";

import { Orcamento } from "../../domain/Orcamento";
import {
  OrcamentoNaoEncontradoError,
  OrcamentoStatusConflitoError,
  OrcamentoStatusInvalidoError,
} from "../../domain/errors";
import { cabecalhoValido } from "../test-doubles/fakes";
import { AceitarOrcamento } from "./AceitarOrcamento";
import { seedContextoOrcamento } from "./helpers-test";

function orcamentoEnviado(
  ctx: Awaited<ReturnType<typeof seedContextoOrcamento>>,
  id = "orc-1",
): Orcamento {
  return Orcamento.emitir({
    id,
    clinicaId: ctx.clinicaId,
    prontuarioId: ctx.prontuario.id,
    profissionalId: ctx.profissional.id,
    itens: [
      {
        procedimentoId: ctx.procedimento.id,
        nome: "Limpeza",
        valor: 150,
        quantidade: 1,
      },
    ],
    cabecalho: cabecalhoValido,
    validoAte: new Date("2026-09-01T00:00:00.000Z"),
  });
}

describe("AceitarOrcamento", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s registra aceite: enviado → aceito sem alterar itens",
    async (papel) => {
      const ctx = await seedContextoOrcamento(papel);
      const orcamento = orcamentoEnviado(ctx);
      await ctx.orcamentoRepo.salvar(orcamento);

      const sut = new AceitarOrcamento(
        ctx.orcamentoRepo,
        ctx.profissionalRepo,
      );

      const aceito = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      });

      expect(aceito.status).toBe("aceito");
      expect(aceito.itens[0]!.nome).toBe("Limpeza");
      expect(aceito.itens[0]!.valor).toBe(150);
      expect(aceito.validoAte).toEqual(orcamento.validoAte);
      expect(
        (await ctx.orcamentoRepo.buscarPorId(ctx.clinicaId, orcamento.id))
          ?.status,
      ).toBe("aceito");
    },
  );

  it("recepção NÃO é negada ao aceitar", async () => {
    const ctx = await seedContextoOrcamento("recepcao");
    const orcamento = orcamentoEnviado(ctx);
    await ctx.orcamentoRepo.salvar(orcamento);
    const sut = new AceitarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      }),
    ).resolves.toMatchObject({ status: "aceito" });
  });

  it("rejeita aceitar orçamento já aceito com OrcamentoStatusInvalidoError (validação em memória)", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const aceito = orcamentoEnviado(ctx).aceitar();
    await ctx.orcamentoRepo.salvar(aceito);

    const sut = new AceitarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: aceito.id,
      }),
    ).rejects.toBeInstanceOf(OrcamentoStatusInvalidoError);
  });

  it("em corrida (0 linhas afetadas no UPDATE condicional) lança OrcamentoStatusConflitoError — distinto do StatusInvalido", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const orcamento = orcamentoEnviado(ctx);
    await ctx.orcamentoRepo.salvar(orcamento);
    ctx.orcamentoRepo.conflitoNaProximaAtualizacao = true;

    const sut = new AceitarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      }),
    ).rejects.toBeInstanceOf(OrcamentoStatusConflitoError);

    // Ainda enviado no fake (UPDATE não aplicou) — conflito ≠ validação de entidade
    expect(
      (await ctx.orcamentoRepo.buscarPorId(ctx.clinicaId, orcamento.id))
        ?.status,
    ).toBe("enviado");
  });

  it("falha quando orçamento não existe na clínica", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new AceitarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: "orc-inexistente",
      }),
    ).rejects.toBeInstanceOf(OrcamentoNaoEncontradoError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const orcamento = orcamentoEnviado(ctx);
    await ctx.orcamentoRepo.salvar(orcamento);
    const sut = new AceitarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
