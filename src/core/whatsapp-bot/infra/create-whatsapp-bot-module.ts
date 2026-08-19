import { db } from "@/db";
import { DrizzleProfissionalRepository } from "@/core/auth/infra/adapters";

import {
  ConcluirConexaoWhatsapp,
  DesconectarWhatsapp,
  IniciarConexaoWhatsapp,
  ObterStatusConexaoWhatsapp,
  RenovarTokenWhatsapp,
  RotearEventoWhatsapp,
} from "../application/use-cases";
import {
  AesGcmCriptografiaAdapter,
  DrizzleClinicWhatsappAccountRepository,
  MetaGraphApiAdapter,
  MetaWebhookAdapter,
} from "./adapters";

export type WhatsappBotModuleConfig = {
  metaAppId: string;
  metaAppSecret: string;
  embeddedSignupConfigId: string;
  /** Opcional; default lido de `META_GRAPH_API_VERSION` / v21.0 no adapter. */
  graphApiVersion?: string;
};

/**
 * Composition root do módulo whatsapp-bot (spec 008 — conexão Embedded Signup).
 */
export function createWhatsappBotModule(config: WhatsappBotModuleConfig) {
  const contaRepo = new DrizzleClinicWhatsappAccountRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const criptografia = new AesGcmCriptografiaAdapter();
  const metaGraph = new MetaGraphApiAdapter({
    appId: config.metaAppId,
    appSecret: config.metaAppSecret,
    graphApiVersion: config.graphApiVersion,
  });

  const configuracaoPlataforma = {
    appId: config.metaAppId,
    configurationId: config.embeddedSignupConfigId,
  };

  return {
    contaRepo,
    criptografia,
    metaGraph,
    iniciarConexaoWhatsapp: new IniciarConexaoWhatsapp(
      contaRepo,
      profissionalRepo,
      configuracaoPlataforma,
    ),
    concluirConexaoWhatsapp: new ConcluirConexaoWhatsapp(
      contaRepo,
      metaGraph,
      criptografia,
      profissionalRepo,
    ),
    desconectarWhatsapp: new DesconectarWhatsapp(contaRepo, profissionalRepo),
    obterStatusConexaoWhatsapp: new ObterStatusConexaoWhatsapp(
      contaRepo,
      profissionalRepo,
    ),
    renovarTokenWhatsapp: new RenovarTokenWhatsapp(
      contaRepo,
      metaGraph,
      criptografia,
    ),
  };
}

/**
 * Composition root do webhook (Meta → plataforma).
 *
 * Deliberadamente separado de `createWhatsappBotModule`: o webhook só precisa
 * de `META_APP_SECRET` (assinatura) e `META_WEBHOOK_VERIFY_TOKEN` (handshake).
 * Exigir `META_EMBEDDED_SIGNUP_CONFIG_ID` aqui faria uma configuração ausente
 * do fluxo de conexão derrubar o recebimento de mensagens de quem já conectou.
 */
export function createWhatsappWebhookModuleFromEnv(
  env: NodeJS.ProcessEnv = process.env,
) {
  const contaRepo = new DrizzleClinicWhatsappAccountRepository(db);

  return {
    webhook: MetaWebhookAdapter.fromEnv(env),
    rotearEventoWhatsapp: new RotearEventoWhatsapp(contaRepo),
  };
}

export function createWhatsappBotModuleFromEnv(
  env: NodeJS.ProcessEnv = process.env,
) {
  const metaAppId = env.META_APP_ID?.trim() ?? "";
  const metaAppSecret = env.META_APP_SECRET?.trim() ?? "";
  const embeddedSignupConfigId =
    env.META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ?? "";

  if (!metaAppId || !metaAppSecret || !embeddedSignupConfigId) {
    throw new Error(
      "META_APP_ID, META_APP_SECRET e META_EMBEDDED_SIGNUP_CONFIG_ID são obrigatórios.",
    );
  }

  return createWhatsappBotModule({
    metaAppId,
    metaAppSecret,
    embeddedSignupConfigId,
    graphApiVersion: env.META_GRAPH_API_VERSION?.trim() || undefined,
  });
}
