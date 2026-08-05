"use server";

import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { createOdontogramaModule } from "@/core/odontograma/infra/create-odontograma-module";
import {
  eventoOdontogramaParaDto,
  odontogramaVigenteParaDto,
} from "@/lib/odontograma/mapear";
import {
  consultarOdontogramaSchema,
  listarHistoricoOdontogramaSchema,
  registrarEventosOdontogramaSchema,
} from "@/lib/odontograma/schema";
import type {
  EventoOdontogramaDTO,
  OdontogramaVigenteDTO,
} from "@/lib/odontograma/types";
import { actionClient } from "@/lib/safe-action";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return ctx;
}

export const consultarOdontogramaVigenteAction = actionClient
  .inputSchema(consultarOdontogramaSchema)
  .action(async ({ parsedInput }): Promise<OdontogramaVigenteDTO> => {
    const sessao = await exigirSessao();
    const mod = createOdontogramaModule();
    const vigente = await mod.consultarOdontogramaVigente.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
    });
    return odontogramaVigenteParaDto(vigente);
  });

export const registrarEventosOdontogramaAction = actionClient
  .inputSchema(registrarEventosOdontogramaSchema)
  .action(async ({ parsedInput }): Promise<EventoOdontogramaDTO[]> => {
    const sessao = await exigirSessao();
    const mod = createOdontogramaModule();
    const eventos = await mod.registrarEventosOdontograma.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
      eventos: parsedInput.eventos.map((e) => ({
        numeroDente: e.numeroDente,
        nivel: e.nivel,
        face: e.nivel === "face" ? e.face : null,
        estadoNovo: e.estadoNovo,
        procedimentoId: e.procedimentoId ?? null,
      })),
    });

    const membros = await mod.profissionalRepo.listarPorClinica(
      sessao.clinicaId,
    );
    const nomes = new Map(membros.map((m) => [m.id, m.nome]));

    return eventos.map((ev) =>
      eventoOdontogramaParaDto(
        ev,
        nomes.get(ev.profissionalId) ?? "Profissional",
      ),
    );
  });

export const listarHistoricoOdontogramaAction = actionClient
  .inputSchema(listarHistoricoOdontogramaSchema)
  .action(async ({ parsedInput }): Promise<EventoOdontogramaDTO[]> => {
    const sessao = await exigirSessao();
    const mod = createOdontogramaModule();
    const eventos = await mod.listarHistoricoOdontograma.executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      prontuarioId: parsedInput.prontuarioId,
      filtros:
        parsedInput.numeroDente != null
          ? { numeroDente: parsedInput.numeroDente }
          : undefined,
    });

    const membros = await mod.profissionalRepo.listarPorClinica(
      sessao.clinicaId,
    );
    const nomes = new Map(membros.map((m) => [m.id, m.nome]));

    // UI: mais recente primeiro (backend retorna ascendente).
    return [...eventos]
      .reverse()
      .map((ev) =>
        eventoOdontogramaParaDto(
          ev,
          nomes.get(ev.profissionalId) ?? "Profissional",
        ),
      );
  });
