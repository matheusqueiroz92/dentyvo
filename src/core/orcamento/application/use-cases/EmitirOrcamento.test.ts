import { describe, expect, it } from "vitest";

import { Procedimento } from "@/core/agendamento/domain/Procedimento";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";
import { TenantMismatchError } from "@/core/shared/errors";

import { OrcamentoSemItensError } from "../../domain/errors";
import { EmitirOrcamento } from "./EmitirOrcamento";
import { seedContextoOrcamento } from "./helpers-test";

describe("EmitirOrcamento", () => {
  it.each(["admin", "dentista", "recepcao"] as const)(
    "%s emite orçamento com status enviado e snapshot de cabeçalho",
    async (papel) => {
      const ctx = await seedContextoOrcamento(papel);
      const sut = new EmitirOrcamento(
        ctx.orcamentoRepo,
        ctx.prontuarioRepo,
        ctx.clinicaRepo,
        ctx.profissionalRepo,
        ctx.pacienteRepo,
        ctx.procedimentoRepo,
      );

      const orcamento = await sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        itens: [{ procedimentoId: ctx.procedimento.id }],
      });

      expect(orcamento.status).toBe("enviado");
      expect(orcamento.profissionalId).toBe(ctx.profissional.id);
      expect(orcamento.itens[0]!.procedimentoId).toBe(ctx.procedimento.id);
      expect(orcamento.itens[0]!.nome).toBe("Limpeza");
      expect(orcamento.itens[0]!.valor).toBe(150);
      expect(orcamento.cabecalho.clinicaNome).toBe(ctx.clinica.nome);
      expect(orcamento.cabecalho.pacienteNome).toBe(ctx.paciente.nome);
      expect(
        await ctx.orcamentoRepo.buscarPorId(ctx.clinicaId, orcamento.id),
      ).not.toBeNull();
    },
  );

  it("recepção NÃO recebe PermissaoNegadaError ao emitir (matriz comercial)", async () => {
    const ctx = await seedContextoOrcamento("recepcao");
    const sut = new EmitirOrcamento(
      ctx.orcamentoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
      ctx.procedimentoRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        itens: [{ procedimentoId: ctx.procedimento.id }],
      }),
    ).resolves.toMatchObject({ status: "enviado" });
  });

  it("usa valor ajustado na criação quando informado; senão o do Procedimento", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new EmitirOrcamento(
      ctx.orcamentoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
      ctx.procedimentoRepo,
    );

    const comOverride = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      itens: [{ procedimentoId: ctx.procedimento.id, valor: 180, quantidade: 2 }],
    });
    const comSugestao = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      itens: [{ procedimentoId: ctx.procedimento.id }],
    });

    expect(comOverride.itens[0]!.valor).toBe(180);
    expect(comOverride.itens[0]!.quantidade).toBe(2);
    expect(comOverride.total).toBe(360);
    expect(comSugestao.itens[0]!.valor).toBe(150);
    expect(comSugestao.itens[0]!.quantidade).toBe(1);
  });

  it("preserva snapshot de nome/valor do item mesmo após alteração do Procedimento de origem", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new EmitirOrcamento(
      ctx.orcamentoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
      ctx.procedimentoRepo,
    );

    const orcamento = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      itens: [{ procedimentoId: ctx.procedimento.id, valor: 150 }],
    });

    await ctx.procedimentoRepo.salvar(
      Procedimento.reconstituir({
        id: ctx.procedimento.id,
        clinicaId: ctx.clinicaId,
        nome: "Limpeza Premium Renomeada",
        duracaoPadraoMinutos: 45,
        valor: 999,
      }),
    );

    const persistido = await ctx.orcamentoRepo.buscarPorId(
      ctx.clinicaId,
      orcamento.id,
    );

    expect(persistido?.itens[0]!.nome).toBe("Limpeza");
    expect(persistido?.itens[0]!.valor).toBe(150);
    expect(
      (await ctx.procedimentoRepo.buscarPorId(ctx.clinicaId, ctx.procedimento.id))
        ?.valor,
    ).toBe(999);
  });

  it("aceita validoAte opcional sem efeito automático no status", async () => {
    const ctx = await seedContextoOrcamento("admin");
    const sut = new EmitirOrcamento(
      ctx.orcamentoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
      ctx.procedimentoRepo,
    );
    const prazo = new Date("2026-09-30T00:00:00.000Z");

    const comPrazo = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      itens: [{ procedimentoId: ctx.procedimento.id }],
      validoAte: prazo,
    });
    const semPrazo = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      itens: [{ procedimentoId: ctx.procedimento.id }],
    });

    expect(comPrazo.status).toBe("enviado");
    expect(comPrazo.validoAte).toEqual(prazo);
    expect(semPrazo.status).toBe("enviado");
    expect(semPrazo.validoAte).toBeNull();
  });

  it("usa profissionalId da sessão, não um id arbitrário", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new EmitirOrcamento(
      ctx.orcamentoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
      ctx.procedimentoRepo,
    );

    const orcamento = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      prontuarioId: ctx.prontuario.id,
      itens: [{ procedimentoId: ctx.procedimento.id }],
    });

    expect(orcamento.profissionalId).toBe(ctx.profissional.id);
    expect(orcamento.profissionalId).not.toBe("prof-arbitrario");
  });

  it("rejeita emissão sem itens", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new EmitirOrcamento(
      ctx.orcamentoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
      ctx.procedimentoRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        itens: [],
      }),
    ).rejects.toBeInstanceOf(OrcamentoSemItensError);
  });

  it("falha quando prontuário não existe na clínica", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new EmitirOrcamento(
      ctx.orcamentoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
      ctx.procedimentoRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: "pront-inexistente",
        itens: [{ procedimentoId: ctx.procedimento.id }],
      }),
    ).rejects.toBeInstanceOf(ProntuarioNaoEncontradoError);
  });

  it("isola por tenant", async () => {
    const ctx = await seedContextoOrcamento("dentista");
    const sut = new EmitirOrcamento(
      ctx.orcamentoRepo,
      ctx.prontuarioRepo,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.pacienteRepo,
      ctx.procedimentoRepo,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        prontuarioId: ctx.prontuario.id,
        itens: [{ procedimentoId: ctx.procedimento.id }],
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
