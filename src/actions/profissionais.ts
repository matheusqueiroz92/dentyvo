"use server";

import { z } from "zod";

import {
  AlterarPapelMembro,
  ConvidarUsuario,
  ObterContextoSessao,
  RemoverMembro,
  RevogarSessoesDoMembro,
} from "@/core/auth/application/use-cases";
import { PAPEIS } from "@/core/auth/domain/Papel";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import {
  emailsPorUsuarioIds,
  montarListaEquipe,
  type EquipeInicial,
} from "@/lib/profissionais/carregar-equipe";
import { conviteParaDto, membroParaDto } from "@/lib/profissionais/mapear";
import type {
  ConviteEquipeDTO,
  MembroEquipeDTO,
} from "@/lib/profissionais/types";
import { actionClient } from "@/lib/safe-action";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return { auth, ctx };
}

export const listarEquipeAction = actionClient.action(
  async (): Promise<EquipeInicial> => {
    const { ctx } = await exigirSessao();
    return montarListaEquipe(ctx);
  },
);

export const convidarUsuarioAction = actionClient
  .inputSchema(
    z.object({
      email: z.string().trim().email(),
      papel: z.enum(PAPEIS),
    }),
  )
  .action(async ({ parsedInput }): Promise<ConviteEquipeDTO> => {
    const { auth, ctx } = await exigirSessao();
    const convite = await new ConvidarUsuario(
      auth.conviteRepo,
      auth.profissionalRepo,
      auth.clinicaRepo,
      auth.authPort,
      auth.email,
    ).executar({
      clinicaId: ctx.clinicaId,
      email: parsedInput.email,
      papel: parsedInput.papel,
      convidadoPorUsuarioId: ctx.usuarioId,
    });
    return conviteParaDto(convite);
  });

export const alterarPapelMembroAction = actionClient
  .inputSchema(
    z.object({
      profissionalId: z.string().min(1),
      novoPapel: z.enum(PAPEIS),
      cro: z.string().trim().min(1).optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<MembroEquipeDTO> => {
    const { auth, ctx } = await exigirSessao();
    const atualizado = await new AlterarPapelMembro(
      auth.profissionalRepo,
      auth.authPort,
    ).executar({
      clinicaId: ctx.clinicaId,
      profissionalId: parsedInput.profissionalId,
      novoPapel: parsedInput.novoPapel,
      solicitadoPorUsuarioId: ctx.usuarioId,
      ...(parsedInput.cro !== undefined ? { cro: parsedInput.cro } : {}),
    });
    const emails = await emailsPorUsuarioIds([atualizado.usuarioId]);
    return membroParaDto(
      atualizado,
      emails.get(atualizado.usuarioId) ?? "",
    );
  });

export const removerMembroAction = actionClient
  .inputSchema(z.object({ profissionalId: z.string().min(1) }))
  .action(async ({ parsedInput }): Promise<void> => {
    const { auth, ctx } = await exigirSessao();
    await new RemoverMembro(auth.profissionalRepo, auth.authPort).executar({
      clinicaId: ctx.clinicaId,
      profissionalId: parsedInput.profissionalId,
      solicitadoPorUsuarioId: ctx.usuarioId,
    });
  });

export const revogarSessoesDoMembroAction = actionClient
  .inputSchema(z.object({ profissionalId: z.string().min(1) }))
  .action(async ({ parsedInput }): Promise<void> => {
    const { auth, ctx } = await exigirSessao();
    await new RevogarSessoesDoMembro(
      auth.profissionalRepo,
      auth.authPort,
    ).executar({
      clinicaId: ctx.clinicaId,
      profissionalId: parsedInput.profissionalId,
      solicitadoPorUsuarioId: ctx.usuarioId,
    });
  });
