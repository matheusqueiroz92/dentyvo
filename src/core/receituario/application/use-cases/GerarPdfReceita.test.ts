import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { ReceitaNaoEncontradaError } from "../../domain/errors";
import { Receita } from "../../domain/Receita";
import {
  cabecalhoValido,
  itemReceitaValido,
} from "../test-doubles/fakes";
import { GerarPdfReceita } from "./GerarPdfReceita";
import { seedContextoReceituario } from "./helpers-test";

describe("GerarPdfReceita", () => {
  it("dentista gera PDF sob demanda a partir do snapshot (sem blob persistido)", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const receita = Receita.emitir({
      id: "rec-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      itens: [itemReceitaValido],
      cabecalho: cabecalhoValido,
      emitidaEm: new Date("2026-07-28T15:00:00.000Z"),
    });
    await ctx.receitaRepo.salvar(receita);

    const sut = new GerarPdfReceita(
      ctx.receitaRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    const arquivo = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      receitaId: receita.id,
    });

    expect(arquivo.contentType).toBe("application/pdf");
    expect(arquivo.bytes).toEqual(ctx.geradorPdf.bytesGerados);
    expect(arquivo.nomeArquivo.length).toBeGreaterThan(0);
    expect(ctx.geradorPdf.geracoes).toHaveLength(1);

    const passadaAoGerador = ctx.geradorPdf.geracoes[0]!;
    expect(passadaAoGerador.cabecalho.profissionalCro).toBe("12345");
    expect(passadaAoGerador.cabecalho.pacienteNome).toBe("Ana Paciente");
    expect(passadaAoGerador.cabecalho.clinicaNome).toBe("Clínica Sorriso");
    expect(passadaAoGerador.itens[0]?.medicamento).toBe("Amoxicilina");
    expect(passadaAoGerador.emitidaEm).toEqual(receita.emitidaEm);
  });

  it("não resolve cadastro ao vivo — usa snapshot mesmo após alteração da clínica", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const receita = Receita.emitir({
      id: "rec-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      itens: [itemReceitaValido],
      cabecalho: cabecalhoValido,
    });
    await ctx.receitaRepo.salvar(receita);

    await ctx.clinicaRepo.salvar(
      ctx.clinica.atualizarDadosCadastrais({
        nome: "Clínica Renomeada Depois",
        endereco: "Endereço Novo",
      }),
    );

    const sut = new GerarPdfReceita(
      ctx.receitaRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      receitaId: receita.id,
    });

    expect(ctx.geradorPdf.geracoes[0]?.cabecalho.clinicaNome).toBe(
      "Clínica Sorriso",
    );
    expect(ctx.geradorPdf.geracoes[0]?.cabecalho.clinicaEndereco).toBe(
      "Rua A, 100",
    );
  });

  it("regenera bytes a cada chamada (sem cache de PDF)", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const receita = Receita.emitir({
      id: "rec-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      itens: [itemReceitaValido],
      cabecalho: cabecalhoValido,
    });
    await ctx.receitaRepo.salvar(receita);

    const sut = new GerarPdfReceita(
      ctx.receitaRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      receitaId: receita.id,
    });
    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      receitaId: receita.id,
    });

    expect(ctx.geradorPdf.geracoes).toHaveLength(2);
  });

  it.each(["admin", "recepcao"] as const)(
    "%s não gera PDF",
    async (papel) => {
      const ctx = await seedContextoReceituario(papel);
      const receita = Receita.emitir({
        id: "rec-1",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        profissionalId: "prof-dentista",
        itens: [itemReceitaValido],
        cabecalho: cabecalhoValido,
      });
      await ctx.receitaRepo.salvar(receita);

      const sut = new GerarPdfReceita(
        ctx.receitaRepo,
        ctx.geradorPdf,
        ctx.profissionalRepo,
      );

      await expect(
        sut.executar({
          clinicaId: ctx.clinicaId,
          solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
          receitaId: receita.id,
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);
    },
  );

  it("falha quando receita não existe na clínica", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const sut = new GerarPdfReceita(
      ctx.receitaRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        receitaId: "rec-inexistente",
      }),
    ).rejects.toBeInstanceOf(ReceitaNaoEncontradaError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoReceituario("dentista");
    const receita = Receita.emitir({
      id: "rec-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: ctx.profissional.id,
      itens: [itemReceitaValido],
      cabecalho: cabecalhoValido,
    });
    await ctx.receitaRepo.salvar(receita);

    const sut = new GerarPdfReceita(
      ctx.receitaRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        receitaId: receita.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
