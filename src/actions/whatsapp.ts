"use server";

import { z } from "zod";

import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import {
  ConcluirConexaoWhatsapp,
  DesconectarWhatsapp,
  IniciarConexaoWhatsapp,
  ObterStatusConexaoWhatsapp,
} from "@/core/whatsapp-bot/application/use-cases";
import {
  AesGcmCriptografiaAdapter,
  DrizzleClinicWhatsappAccountRepository,
  GRAPH_API_VERSION_PADRAO,
  MetaGraphApiAdapter,
} from "@/core/whatsapp-bot/infra/adapters";
import { db } from "@/db";
import { statusWhatsappParaDto } from "@/lib/configuracoes/mapear-whatsapp";
import type {
  ConfiguracaoPopupWhatsappDTO,
  StatusWhatsappDTO,
} from "@/lib/configuracoes/whatsapp-types";
import { actionClient } from "@/lib/safe-action";

async function contextoAutenticado() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return { ctx, profissionalRepo: auth.profissionalRepo };
}

function contaRepo() {
  return new DrizzleClinicWhatsappAccountRepository(db);
}

export const obterStatusWhatsappAction = actionClient.action(
  async (): Promise<{ papel: string; status: StatusWhatsappDTO }> => {
    const { ctx, profissionalRepo } = await contextoAutenticado();

    const uc = new ObterStatusConexaoWhatsapp(contaRepo(), profissionalRepo);
    const status = await uc.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
    });

    return { papel: ctx.papel, status: statusWhatsappParaDto(status) };
  },
);

export const iniciarConexaoWhatsappAction = actionClient.action(
  async (): Promise<ConfiguracaoPopupWhatsappDTO> => {
    const { ctx, profissionalRepo } = await contextoAutenticado();

    const appId = process.env.META_APP_ID?.trim() ?? "";
    const configurationId =
      process.env.META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ?? "";
    if (!appId || !configurationId) {
      throw new Error(
        "Integração WhatsApp não configurada nesta instalação. Fale com o suporte.",
      );
    }

    const uc = new IniciarConexaoWhatsapp(contaRepo(), profissionalRepo, {
      appId,
      configurationId,
    });
    const popup = await uc.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
    });

    return {
      appId: popup.appId,
      configurationId: popup.configurationId,
      graphApiVersion:
        process.env.META_GRAPH_API_VERSION?.trim() || GRAPH_API_VERSION_PADRAO,
    };
  },
);

export const concluirConexaoWhatsappAction = actionClient
  .inputSchema(
    z.object({
      codigoOAuth: z
        .string()
        .trim()
        .min(1, "Código de autorização da Meta ausente."),
    }),
  )
  .action(async ({ parsedInput }): Promise<StatusWhatsappDTO> => {
    const { ctx, profissionalRepo } = await contextoAutenticado();
    const repo = contaRepo();

    const uc = new ConcluirConexaoWhatsapp(
      repo,
      MetaGraphApiAdapter.fromEnv(),
      new AesGcmCriptografiaAdapter(),
      profissionalRepo,
    );
    const conta = await uc.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
      codigoOAuth: parsedInput.codigoOAuth,
    });

    return statusWhatsappParaDto({
      status: conta.status,
      phoneNumberId: conta.phoneNumberId,
      conectadoEm: conta.conectadoEm,
      tokenExpiraEm: conta.tokenExpiraEm,
    });
  });

export const desconectarWhatsappAction = actionClient.action(
  async (): Promise<{ status: "desconectado" }> => {
    const { ctx, profissionalRepo } = await contextoAutenticado();

    const uc = new DesconectarWhatsapp(contaRepo(), profissionalRepo);
    await uc.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.usuarioId,
    });

    return { status: "desconectado" };
  },
);
