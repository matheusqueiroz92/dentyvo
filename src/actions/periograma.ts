"use server";

import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { createPeriogramaModule } from "@/core/periograma/infra/create-periograma-module";
import {
  periogramaParaDto,
  periogramaParaListaDto,
} from "@/lib/periograma/mapear";
import {
  consultarPeriogramaSchema,
  listarPeriogramasSchema,
  registrarPeriogramaSchema,
} from "@/lib/periograma/schema";
import type {
  PeriogramaDTO,
  PeriogramaListaDTO,
} from "@/lib/periograma/types";
import { actionClient } from "@/lib/safe-action";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return ctx;
}

export const listarPeriogramasDoProntuarioAction = actionClient
  .inputSchema(listarPeriogramasSchema)
  .action(async ({ parsedInput }): Promise<PeriogramaListaDTO[]> => {
    const sessao = await exigirSessao();
    const mod = createPeriogramaModule();
    const periogramas = await mod.listarPeriogramasDoProntuario.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
    });

    const membros = await mod.profissionalRepo.listarPorClinica(
      sessao.clinicaId,
    );
    const nomes = new Map(membros.map((m) => [m.id, m.nome]));
    return periogramas.map((p) =>
      periogramaParaListaDto(p, nomes.get(p.profissionalId) ?? "Profissional"),
    );
  });

export const consultarPeriogramaAction = actionClient
  .inputSchema(consultarPeriogramaSchema)
  .action(async ({ parsedInput }): Promise<PeriogramaDTO> => {
    const sessao = await exigirSessao();
    const mod = createPeriogramaModule();
    const periograma = await mod.consultarPeriograma.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      periogramaId: parsedInput.periogramaId,
    });

    const membros = await mod.profissionalRepo.listarPorClinica(
      sessao.clinicaId,
    );
    const nomes = new Map(membros.map((m) => [m.id, m.nome]));
    return periogramaParaDto(
      periograma,
      nomes.get(periograma.profissionalId) ?? "Profissional",
    );
  });

/**
 * Registra periograma imutável. `profissionalId` vem só da sessão no use case.
 */
export const registrarPeriogramaAction = actionClient
  .inputSchema(registrarPeriogramaSchema)
  .action(async ({ parsedInput }): Promise<PeriogramaDTO> => {
    const sessao = await exigirSessao();
    const mod = createPeriogramaModule();
    const periograma = await mod.registrarPeriograma.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
      tipo: parsedInput.tipo,
      dentes: parsedInput.dentes.map((d) => ({
        numeroDente: d.numeroDente,
        mobilidade: d.mobilidade ?? null,
        implante: d.implante ?? null,
        classificacaoFurca: d.classificacaoFurca ?? null,
        nota: d.nota ?? null,
        pontos: (d.pontos ?? []).map((p) => ({
          lado: p.lado,
          posicao: p.posicao,
          margemGengival: p.margemGengival ?? null,
          profundidadeSondagem: p.profundidadeSondagem ?? null,
          placa: p.placa ?? null,
          sangramentoSondagem: p.sangramentoSondagem ?? null,
        })),
      })),
    });

    const membros = await mod.profissionalRepo.listarPorClinica(
      sessao.clinicaId,
    );
    const nomes = new Map(membros.map((m) => [m.id, m.nome]));
    return periogramaParaDto(
      periograma,
      nomes.get(periograma.profissionalId) ?? "Profissional",
    );
  });
