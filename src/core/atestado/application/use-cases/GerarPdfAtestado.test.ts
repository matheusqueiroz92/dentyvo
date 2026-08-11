import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { Atestado } from "../../domain/Atestado";
import { AtestadoNaoEncontradoError } from "../../domain/errors";
import { cabecalhoValido } from "../test-doubles/fakes";
import { GerarPdfAtestado } from "./GerarPdfAtestado";
import { seedContextoAtestado } from "./helpers-test";

function atestadoEmitido(
  ctx: Awaited<ReturnType<typeof seedContextoAtestado>>,
  id = "atest-1",
): Atestado {
  return Atestado.emitir({
    id,
    clinicaId: ctx.clinicaId,
    prontuarioId: ctx.prontuario.id,
    profissionalId: ctx.profissional.id,
    motivo: "repouso pós-procedimento",
    cid: "K08.1",
    dataInicio: new Date("2026-08-11T00:00:00.000Z"),
    quantidadeDias: 3,
    cabecalho: cabecalhoValido,
    emitidaEm: new Date("2026-08-11T15:00:00.000Z"),
  });
}

describe("GerarPdfAtestado", () => {
  it("dentista gera PDF sob demanda a partir do snapshot (sem blob persistido)", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const atestado = atestadoEmitido(ctx);
    await ctx.atestadoRepo.salvar(atestado);

    const sut = new GerarPdfAtestado(
      ctx.atestadoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    const arquivo = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      atestadoId: atestado.id,
    });

    expect(arquivo.contentType).toBe("application/pdf");
    expect(arquivo.bytes).toEqual(ctx.geradorPdf.bytesGerados);
    expect(arquivo.nomeArquivo.length).toBeGreaterThan(0);
    expect(ctx.geradorPdf.geracoesAtestado).toHaveLength(1);

    const passadaAoGerador = ctx.geradorPdf.geracoesAtestado[0]!;
    expect(passadaAoGerador.cabecalho.profissionalCro).toBe("12345");
    expect(passadaAoGerador.cabecalho.pacienteNome).toBe("Ana Paciente");
    expect(passadaAoGerador.cabecalho.clinicaNome).toBe("Clínica Sorriso");
    expect(passadaAoGerador.motivo).toBe("repouso pós-procedimento");
    expect(passadaAoGerador.cid).toBe("K08.1");
    expect(passadaAoGerador.dataInicio).toEqual(atestado.dataInicio);
    expect(passadaAoGerador.dataFim).toEqual(atestado.dataFim);
    expect(passadaAoGerador.emitidaEm).toEqual(atestado.emitidaEm);
  });

  it("não resolve cadastro ao vivo — usa snapshot mesmo após alteração da clínica", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const atestado = atestadoEmitido(ctx);
    await ctx.atestadoRepo.salvar(atestado);

    await ctx.clinicaRepo.salvar(
      ctx.clinica.atualizarDadosCadastrais({
        nome: "Clínica Renomeada Depois",
        endereco: "Endereço Novo",
      }),
    );

    const sut = new GerarPdfAtestado(
      ctx.atestadoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      atestadoId: atestado.id,
    });

    expect(ctx.geradorPdf.geracoesAtestado[0]?.cabecalho.clinicaNome).toBe(
      "Clínica Sorriso",
    );
    expect(ctx.geradorPdf.geracoesAtestado[0]?.cabecalho.clinicaEndereco).toBe(
      "Rua A, 100",
    );
  });

  it("regenera bytes a cada chamada (sem cache de PDF)", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const atestado = atestadoEmitido(ctx);
    await ctx.atestadoRepo.salvar(atestado);

    const sut = new GerarPdfAtestado(
      ctx.atestadoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      atestadoId: atestado.id,
    });
    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      atestadoId: atestado.id,
    });

    expect(ctx.geradorPdf.geracoesAtestado).toHaveLength(2);
  });

  it("admin da clínica não gera PDF de atestado", async () => {
    const ctx = await seedContextoAtestado("admin");
    const atestado = Atestado.emitir({
      id: "atest-1",
      clinicaId: ctx.clinicaId,
      prontuarioId: ctx.prontuario.id,
      profissionalId: "prof-dentista",
      motivo: "repouso",
      dataInicio: new Date("2026-08-11T00:00:00.000Z"),
      quantidadeDias: 1,
      cabecalho: cabecalhoValido,
    });
    await ctx.atestadoRepo.salvar(atestado);

    const sut = new GerarPdfAtestado(
      ctx.atestadoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        atestadoId: atestado.id,
      }),
    ).rejects.toBeInstanceOf(PermissaoNegadaError);
  });

  it.each(["admin", "recepcao"] as const)(
    "%s não gera PDF",
    async (papel) => {
      const ctx = await seedContextoAtestado(papel);
      const atestado = Atestado.emitir({
        id: "atest-1",
        clinicaId: ctx.clinicaId,
        prontuarioId: ctx.prontuario.id,
        profissionalId: "prof-dentista",
        motivo: "repouso",
        dataInicio: new Date("2026-08-11T00:00:00.000Z"),
        quantidadeDias: 1,
        cabecalho: cabecalhoValido,
      });
      await ctx.atestadoRepo.salvar(atestado);

      const sut = new GerarPdfAtestado(
        ctx.atestadoRepo,
        ctx.geradorPdf,
        ctx.profissionalRepo,
      );

      await expect(
        sut.executar({
          clinicaId: ctx.clinicaId,
          solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
          atestadoId: atestado.id,
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);
    },
  );

  it("falha quando atestado não existe na clínica", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const sut = new GerarPdfAtestado(
      ctx.atestadoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        atestadoId: "atest-inexistente",
      }),
    ).rejects.toBeInstanceOf(AtestadoNaoEncontradoError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoAtestado("dentista");
    const atestado = atestadoEmitido(ctx);
    await ctx.atestadoRepo.salvar(atestado);

    const sut = new GerarPdfAtestado(
      ctx.atestadoRepo,
      ctx.geradorPdf,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        atestadoId: atestado.id,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
