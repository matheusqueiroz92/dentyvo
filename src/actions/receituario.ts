"use server";

import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { createReceituarioModule } from "@/core/receituario/infra/create-receituario-module";
import { receitaParaListaDto } from "@/lib/receituario/mapear";
import {
  emitirReceitaActionSchema,
  gerarPdfReceitaSchema,
  listarReceitasSchema,
} from "@/lib/receituario/schema";
import type {
  ArquivoPdfReceitaDTO,
  ReceitaListaDTO,
} from "@/lib/receituario/types";
import { actionClient } from "@/lib/safe-action";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return ctx;
}

export const listarReceitasDoProntuarioAction = actionClient
  .inputSchema(listarReceitasSchema)
  .action(async ({ parsedInput }): Promise<ReceitaListaDTO[]> => {
    const sessao = await exigirSessao();
    const mod = createReceituarioModule();
    const receitas = await mod.listarReceitasDoProntuario.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
    });

    return receitas.map((r) =>
      receitaParaListaDto(r, r.cabecalho.profissionalNome),
    );
  });

/**
 * Emite receita. `profissionalId` vem só da sessão no use case —
 * o input da action não aceita profissionalId.
 */
export const emitirReceitaAction = actionClient
  .inputSchema(emitirReceitaActionSchema)
  .action(async ({ parsedInput }): Promise<ReceitaListaDTO> => {
    const sessao = await exigirSessao();
    const mod = createReceituarioModule();
    const receita = await mod.emitirReceita.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
      itens: parsedInput.itens,
    });

    return receitaParaListaDto(receita, receita.cabecalho.profissionalNome);
  });

export const gerarPdfReceitaAction = actionClient
  .inputSchema(gerarPdfReceitaSchema)
  .action(async ({ parsedInput }): Promise<ArquivoPdfReceitaDTO> => {
    const sessao = await exigirSessao();
    const mod = createReceituarioModule();
    const arquivo = await mod.gerarPdfReceita.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      receitaId: parsedInput.receitaId,
    });

    return {
      pdfBase64: Buffer.from(arquivo.bytes).toString("base64"),
      nomeArquivo: arquivo.nomeArquivo,
      contentType: arquivo.contentType,
    };
  });
