import { describe, expect, it } from "vitest";

import { TenantMismatchError } from "@/core/shared/errors";

import { Orcamento } from "../../domain/Orcamento";
import { OrcamentoNaoEncontradoError } from "../../domain/errors";
import { cabecalhoValido } from "../test-doubles/fakes";
import { GerarPdfOrcamento } from "./GerarPdfOrcamento";
import { seedContextoOrcamento } from "./helpers-test";

function orcamentoEmitido(
  ctx: Awaited<ReturnType<typeof seedContextoOrcamento>>,
  override: { id?: string; validoAte?: Date | null } = {},
): Orcamento {
  return Orcamento.emitir({
    id: override.id ?? "orc-1",
    clinicaId: ctx.clinicaId,
    prontuarioId: ctx.prontuario.id,
    profissionalId: ctx.profissional.id,
    itens: [
      {
        procedimentoId: ctx.procedimento.id,
        nome: "Limpeza",
        valor: 150,
        quantidade: 2,
      },
    ],
    cabecalho: cabecalhoValido,
    validoAte: override.validoAte === undefined ? null : override.validoAte,
    emitidoEm: new Date("2026-08-12T15:00:00.000Z"),
  });
}

describe("GerarPdfOrcamento", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s gera PDF sob demanda a partir do snapshot (sem blob persistido)",
    async (papel) => {
      const ctx = await seedContextoOrcamento(papel);
      const orcamento = orcamentoEmitido(ctx, {
        validoAte: new Date("2026-09-30T00:00:00.000Z"),
      });
      await ctx.orcamentoRepo.salvar(orcamento);

      const sut = new GerarPdfOrcamento(
        ctx.orcamentoRepo,
        ctx.geradorPdf,
        ctx.profissionalRepo,
      );

      const arquivo = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      });

      expect(arquivo.contentType).toBe("application/pdf");
      expect(arquivo.bytes).toEqual(ctx.geradorPdf.bytesGerados);
      expect(arquivo.nomeArquivo.length).toBeGreaterThan(0);
      expect(ctx.geradorPdf.geracoesOrcamento).toHaveLength(1);

      const passado = ctx.geradorPdf.geracoesOrcamento[0]!;
      expect(passado.cabecalho.clinicaNome).toBe("Clínica Sorriso");
      expect(passado.itens[0]!.nome).toBe("Limpeza");
      expect(passado.itens[0]!.valor).toBe(150);
      expect(passado.itens[0]!.quantidade).toBe(2);
      expect(passado.total).toBe(300);
      expect(passado.status).toBe("enviado");
      expect(passado.validoAte).toEqual(new Date("2026-09-30T00:00:00.000Z"));
    },
  );

  it("recepção NÃO é negada ao gerar PDF", async () => {
    const ctx = await seedContextoOrcamento("recepcao");
    const orcamento = orcamentoEmitido(ctx);
    await ctx.orcamentoRepo.salvar(orcamento);
    const sut = new GerarPdfOrcamento(
      ctx.orcamentoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      }),
    ).resolves.toMatchObject({ contentType: "application/pdf" });
  });

  it("passa orçamento sem validoAte ao gerador sem inventar prazo", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const orcamento = orcamentoEmitido(ctx, { validoAte: null });
    await ctx.orcamentoRepo.salvar(orcamento);

    const sut = new GerarPdfOrcamento(
      ctx.orcamentoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      orcamentoId: orcamento.id,
    });

    expect(ctx.geradorPdf.geracoesOrcamento[0]!.validoAte).toBeNull();
    expect(ctx.geradorPdf.geracoesOrcamento[0]!.status).toBe("enviado");
  });

  it("não resolve cadastro ao vivo — usa snapshot mesmo após alteração da clínica", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const orcamento = orcamentoEmitido(ctx);
    await ctx.orcamentoRepo.salvar(orcamento);

    await ctx.clinicaRepo.salvar(
      ctx.clinica.atualizarDadosCadastrais({
        nome: "Clínica Renomeada Depois",
        endereco: "Endereço Novo",
      }),
    );

    const sut = new GerarPdfOrcamento(
      ctx.orcamentoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      orcamentoId: orcamento.id,
    });

    expect(ctx.geradorPdf.geracoesOrcamento[0]?.cabecalho.clinicaNome).toBe(
      "Clínica Sorriso",
    );
    expect(ctx.geradorPdf.geracoesOrcamento[0]?.cabecalho.clinicaEndereco).toBe(
      "Rua A, 100",
    );
  });

  it("regenera bytes a cada chamada (sem cache de PDF)", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const orcamento = orcamentoEmitido(ctx);
    await ctx.orcamentoRepo.salvar(orcamento);

    const sut = new GerarPdfOrcamento(
      ctx.orcamentoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      orcamentoId: orcamento.id,
    });
    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      orcamentoId: orcamento.id,
    });

    expect(ctx.geradorPdf.geracoesOrcamento).toHaveLength(2);
  });

  it("falha quando orçamento não existe na clínica", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new GerarPdfOrcamento(
      ctx.orcamentoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

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
    const orcamento = orcamentoEmitido(ctx);
    await ctx.orcamentoRepo.salvar(orcamento);
    const sut = new GerarPdfOrcamento(
      ctx.orcamentoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        orcamentoId: orcamento.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
