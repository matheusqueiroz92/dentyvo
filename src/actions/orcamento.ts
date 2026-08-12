"use server";

import { ListarProcedimentos } from "@/core/agendamento/application/use-cases/ListarProcedimentos";
import { createAgendamentoModule } from "@/core/agendamento/infra/create-agendamento-module";
import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { assertPode } from "@/core/orcamento/domain/autorizacao";
import { createOrcamentoModule } from "@/core/orcamento/infra/create-orcamento-module";
import { createProntuarioModule } from "@/core/prontuario/infra/create-prontuario-module";
import { orcamentoParaListaDto } from "@/lib/orcamento/mapear";
import {
  contextoOrcamentoSchema,
  emitirOrcamentoActionSchema,
  listarOrcamentosSchema,
  orcamentoIdSchema,
} from "@/lib/orcamento/schema";
import type {
  ArquivoPdfOrcamentoDTO,
  ContextoOrcamentoDTO,
  OrcamentoListaDTO,
} from "@/lib/orcamento/types";
import { actionClient } from "@/lib/safe-action";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return ctx;
}

function dataCivilUtcDeIso(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano!, mes! - 1, dia!));
}

export const resolverContextoOrcamentoAction = actionClient
  .inputSchema(contextoOrcamentoSchema)
  .action(async ({ parsedInput }): Promise<ContextoOrcamentoDTO> => {
    const sessao = await exigirSessao();
    const auth = createAuthModule();
    const profissional = await auth.profissionalRepo.buscarPorUsuarioId(
      sessao.usuarioId,
    );
    if (!profissional || profissional.clinicaId !== sessao.clinicaId) {
      throw new Error("Sessão inválida para esta clínica.");
    }
    assertPode(profissional.papel, "listar_orcamentos_prontuario");

    const prontuarioMod = createProntuarioModule();
    const agendamentoMod = createAgendamentoModule();
    const [existente, procedimentos] = await Promise.all([
      prontuarioMod.prontuarioRepo.buscarPorPacienteId(
        sessao.clinicaId,
        parsedInput.pacienteId,
      ),
      new ListarProcedimentos(
        agendamentoMod.procedimentoRepo,
        agendamentoMod.profissionalRepo,
      ).executar({
        clinicaId: sessao.clinicaId,
        solicitadoPorUsuarioId: sessao.usuarioId,
      }),
    ]);

    return {
      prontuarioId: existente?.id ?? null,
      procedimentos: procedimentos.map((p) => ({
        id: p.id,
        nome: p.nome,
        valor: p.valor,
      })),
    };
  });

export const listarOrcamentosDoProntuarioAction = actionClient
  .inputSchema(listarOrcamentosSchema)
  .action(async ({ parsedInput }): Promise<OrcamentoListaDTO[]> => {
    const sessao = await exigirSessao();
    const mod = createOrcamentoModule();
    const orcamentos = await mod.listarOrcamentosDoProntuario.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
    });

    return orcamentos.map((o) =>
      orcamentoParaListaDto(o, o.cabecalho.profissionalNome),
    );
  });

export const emitirOrcamentoAction = actionClient
  .inputSchema(emitirOrcamentoActionSchema)
  .action(async ({ parsedInput }): Promise<OrcamentoListaDTO> => {
    const sessao = await exigirSessao();
    const mod = createOrcamentoModule();
    const validoAte =
      parsedInput.validoAte && parsedInput.validoAte.length > 0
        ? dataCivilUtcDeIso(parsedInput.validoAte)
        : null;

    const orcamento = await mod.emitirOrcamento.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
      itens: parsedInput.itens.map((item) => ({
        procedimentoId: item.procedimentoId,
        valor: item.valor,
        quantidade: item.quantidade,
      })),
      validoAte,
    });

    return orcamentoParaListaDto(
      orcamento,
      orcamento.cabecalho.profissionalNome,
    );
  });

export const aceitarOrcamentoAction = actionClient
  .inputSchema(orcamentoIdSchema)
  .action(async ({ parsedInput }): Promise<OrcamentoListaDTO> => {
    const sessao = await exigirSessao();
    const mod = createOrcamentoModule();
    const orcamento = await mod.aceitarOrcamento.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      orcamentoId: parsedInput.orcamentoId,
    });
    return orcamentoParaListaDto(
      orcamento,
      orcamento.cabecalho.profissionalNome,
    );
  });

export const recusarOrcamentoAction = actionClient
  .inputSchema(orcamentoIdSchema)
  .action(async ({ parsedInput }): Promise<OrcamentoListaDTO> => {
    const sessao = await exigirSessao();
    const mod = createOrcamentoModule();
    const orcamento = await mod.recusarOrcamento.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      orcamentoId: parsedInput.orcamentoId,
    });
    return orcamentoParaListaDto(
      orcamento,
      orcamento.cabecalho.profissionalNome,
    );
  });

export const gerarPdfOrcamentoAction = actionClient
  .inputSchema(orcamentoIdSchema)
  .action(async ({ parsedInput }): Promise<ArquivoPdfOrcamentoDTO> => {
    const sessao = await exigirSessao();
    const mod = createOrcamentoModule();
    const arquivo = await mod.gerarPdfOrcamento.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      orcamentoId: parsedInput.orcamentoId,
    });

    return {
      pdfBase64: Buffer.from(arquivo.bytes).toString("base64"),
      nomeArquivo: arquivo.nomeArquivo,
      contentType: arquivo.contentType,
    };
  });
