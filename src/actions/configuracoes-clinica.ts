"use server";

import { z } from "zod";

import {
  AtualizarClinica,
  AtualizarTemaClinica,
  ObterContextoSessao,
} from "@/core/auth/application/use-cases";
import { TEMAS_CLINICA, type TemaClinica } from "@/core/auth/domain/TemaClinica";
import { ClinicaNaoEncontradaError } from "@/core/auth/domain/errors";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { clinicaParaDtoGeral } from "@/lib/configuracoes/mapear";
import { MENSAGEM_PELO_MENOS_UM_CAMPO } from "@/lib/configuracoes/schema";
import type { ClinicaGeralDTO } from "@/lib/configuracoes/types";
import { actionClient } from "@/lib/safe-action";
import { temaClinicaOuPadrao } from "@/lib/tema-clinica";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return { auth, ctx };
}

export const consultarClinicaAction = actionClient.action(
  async (): Promise<{ papel: string; clinica: ClinicaGeralDTO }> => {
    const { auth, ctx } = await exigirSessao();
    const clinica = await auth.clinicaRepo.buscarPorId(ctx.clinicaId);
    if (!clinica) {
      throw new ClinicaNaoEncontradaError(ctx.clinicaId);
    }
    return {
      papel: ctx.papel,
      clinica: clinicaParaDtoGeral(clinica),
    };
  },
);

const atualizarClinicaSchema = z
  .object({
    nome: z.string().trim().min(1, "Nome da clínica é obrigatório.").optional(),
    endereco: z
      .string()
      .trim()
      .min(1, "Endereço da clínica é obrigatório.")
      .optional(),
  })
  .refine((data) => data.nome !== undefined || data.endereco !== undefined, {
    message: MENSAGEM_PELO_MENOS_UM_CAMPO,
  });

export const atualizarClinicaAction = actionClient
  .inputSchema(atualizarClinicaSchema)
  .action(async ({ parsedInput }): Promise<ClinicaGeralDTO> => {
    const { auth, ctx } = await exigirSessao();
    const uc = new AtualizarClinica(auth.clinicaRepo, auth.profissionalRepo);
    const clinica = await uc.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
      ...(parsedInput.nome !== undefined ? { nome: parsedInput.nome } : {}),
      ...(parsedInput.endereco !== undefined
        ? { endereco: parsedInput.endereco }
        : {}),
    });
    return clinicaParaDtoGeral(clinica);
  });

const atualizarTemaClinicaSchema = z.object({
  tema: z.enum(TEMAS_CLINICA),
});

export const atualizarTemaClinicaAction = actionClient
  .inputSchema(atualizarTemaClinicaSchema)
  .action(async ({ parsedInput }): Promise<{ tema: TemaClinica }> => {
    const { auth, ctx } = await exigirSessao();
    const uc = new AtualizarTemaClinica(
      auth.clinicaRepo,
      auth.profissionalRepo,
    );
    const clinica = await uc.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
      tema: parsedInput.tema,
    });
    return { tema: temaClinicaOuPadrao(clinica.tema) };
  });
