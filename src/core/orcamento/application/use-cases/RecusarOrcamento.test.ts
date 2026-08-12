import { describe, expect, it } from "vitest";

import { TenantMismatchError } from "@/core/shared/errors";

import { Orcamento } from "../../domain/Orcamento";
import {
  OrcamentoNaoEncontradoError,
  OrcamentoStatusConflitoError,
  OrcamentoStatusInvalidoError,
} from "../../domain/errors";
import { cabecalhoValido } from "../test-doubles/fakes";
import { RecusarOrcamento } from "./RecusarOrcamento";
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
      },
    ],
    cabecalho: cabecalhoValido,
  });
}

describe("RecusarOrcamento", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s registra recusa: enviado → recusado sem alterar itens",
    async (papel) => {
      const ctx = await seedContextoOrcamento(papel);
      const orcamento = orcamentoEnviado(ctx);
      await ctx.orcamentoRepo.salvar(orcamento);

      const sut = new RecusarOrcamento(
        ctx.orcamentoRepo,
        ctx.profissionalRepo,
      );

      const recusado = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      });

      expect(recusado.status).toBe("recusado");
      expect(recusado.itens[0]!.nome).toBe("Limpeza");
      expect(recusado.itens[0]!.valor).toBe(150);
      expect(
        (await ctx.orcamentoRepo.buscarPorId(ctx.clinicaId, orcamento.id))
          ?.status,
      ).toBe("recusado");
    },
  );

  it("recepção NÃO é negada ao recusar", async () => {
    const ctx = await seedContextoOrcamento("recepcao");
    const orcamento = orcamentoEnviado(ctx);
    await ctx.orcamentoRepo.salvar(orcamento);
    const sut = new RecusarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      }),
    ).resolves.toMatchObject({ status: "recusado" });
  });

  it("rejeita recusar orçamento já recusado com OrcamentoStatusInvalidoError", async () => {
    const ctx = await seedContextoOrcamento("admin");
    const recusado = orcamentoEnviado(ctx).recusar();
    await ctx.orcamentoRepo.salvar(recusado);
    const sut = new RecusarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: recusado.id,
      }),
    ).rejects.toBeInstanceOf(OrcamentoStatusInvalidoError);
  });

  it("não permite recusar orçamento já aceito (StatusInvalido, não Conflito)", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const aceito = orcamentoEnviado(ctx).aceitar();
    await ctx.orcamentoRepo.salvar(aceito);
    const sut = new RecusarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: aceito.id,
      }),
    ).rejects.toBeInstanceOf(OrcamentoStatusInvalidoError);
  });

  it("em corrida (0 linhas afetadas) lança OrcamentoStatusConflitoError", async () => {
    const ctx = await seedContextoOrcamento("recepcao");
    const orcamento = orcamentoEnviado(ctx);
    await ctx.orcamentoRepo.salvar(orcamento);
    ctx.orcamentoRepo.conflitoNaProximaAtualizacao = true;

    const sut = new RecusarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      }),
    ).rejects.toBeInstanceOf(OrcamentoStatusConflitoError);
  });

  it("falha quando orçamento não existe na clínica", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new RecusarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

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
    const sut = new RecusarOrcamento(ctx.orcamentoRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
