"use server";

import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { createAtestadoModule } from "@/core/atestado/infra/create-atestado-module";
import { atestadoParaListaDto } from "@/lib/atestado/mapear";
import { dataCivilUtcDeIso } from "@/lib/atestado/periodo";
import {
  emitirAtestadoActionSchema,
  gerarPdfAtestadoSchema,
  listarAtestadosSchema,
} from "@/lib/atestado/schema";
import type {
  ArquivoPdfAtestadoDTO,
  AtestadoListaDTO,
} from "@/lib/atestado/types";
import { actionClient } from "@/lib/safe-action";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return ctx;
}

export const listarAtestadosDoProntuarioAction = actionClient
  .inputSchema(listarAtestadosSchema)
  .action(async ({ parsedInput }): Promise<AtestadoListaDTO[]> => {
    const sessao = await exigirSessao();
    const mod = createAtestadoModule();
    const atestados = await mod.listarAtestadosDoProntuario.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
    });

    return atestados.map((a) =>
      atestadoParaListaDto(a, a.cabecalho.profissionalNome),
    );
  });

/**
 * Emite atestado. `profissionalId` vem só da sessão no use case —
 * o input da action não aceita profissionalId.
 */
export const emitirAtestadoAction = actionClient
  .inputSchema(emitirAtestadoActionSchema)
  .action(async ({ parsedInput }): Promise<AtestadoListaDTO> => {
    const sessao = await exigirSessao();
    const mod = createAtestadoModule();
    const atestado = await mod.emitirAtestado.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
      motivo: parsedInput.motivo,
      cid: parsedInput.cid,
      dataInicio: dataCivilUtcDeIso(parsedInput.dataInicio),
      quantidadeDias: parsedInput.quantidadeDias,
    });

    return atestadoParaListaDto(atestado, atestado.cabecalho.profissionalNome);
  });

export const gerarPdfAtestadoAction = actionClient
  .inputSchema(gerarPdfAtestadoSchema)
  .action(async ({ parsedInput }): Promise<ArquivoPdfAtestadoDTO> => {
    const sessao = await exigirSessao();
    const mod = createAtestadoModule();
    const arquivo = await mod.gerarPdfAtestado.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      atestadoId: parsedInput.atestadoId,
    });

    return {
      pdfBase64: Buffer.from(arquivo.bytes).toString("base64"),
      nomeArquivo: arquivo.nomeArquivo,
      contentType: arquivo.contentType,
    };
  });
