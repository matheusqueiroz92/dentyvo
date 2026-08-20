import { createWhatsappWebhookModuleFromEnv } from "@/core/whatsapp-bot/infra/create-whatsapp-bot-module";
import {
  META_WEBHOOK_SIGNATURE_HEADER,
  WebhookWhatsappNaoConfiguradoError,
} from "@/core/whatsapp-bot/infra/adapters";

import {
  executarHandshakeGet,
  processarEventoWebhook,
} from "./processar-webhook";

/** `node:crypto` (HMAC da assinatura) exige runtime Node, não Edge. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/whatsapp/webhook:
 *   get:
 *     tags:
 *       - WhatsApp
 *     summary: Verificação do webhook (Meta Cloud API)
 *     description: >
 *       Handshake exigido pela Meta (`hub.mode`, `hub.verify_token`,
 *       `hub.challenge`). O valor do verify token e demais segredos não
 *       são descritos nesta spec.
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Challenge ecoado quando a verificação é aceita
 *       403:
 *         description: Verificação rejeitada
 *   post:
 *     tags:
 *       - WhatsApp
 *     summary: Eventos inbound da Cloud API
 *     description: >
 *       Endpoint compartilhado entre clínicas (specs 007/008). A assinatura
 *       da Meta é validada antes de processar. Eventos de `phone_number_id`
 *       desconhecido são descartados com log e a resposta permanece de
 *       sucesso (não 5xx). Algoritmo de assinatura e segredos não entram
 *       nesta spec.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Evento aceito (processado ou descartado com segurança)
 *       401:
 *         description: Assinatura ausente ou inválida
 *       500:
 *         description: Falha interna — a Meta deve reentregar o evento
 */
export async function GET(request: Request): Promise<Response> {
  return executarHandshakeGet(new URL(request.url));
}

export async function POST(request: Request): Promise<Response> {
  let modulo;
  try {
    modulo = createWhatsappWebhookModuleFromEnv();
  } catch (erro) {
    if (erro instanceof WebhookWhatsappNaoConfiguradoError) {
      console.error("[whatsapp:webhook]", erro.message);
      return new Response(null, { status: 500 });
    }
    throw erro;
  }

  return processarEventoWebhook({
    webhook: modulo.webhook,
    rotear: modulo.rotearEventoWhatsapp,
    rawBody: await request.text(),
    assinatura: request.headers.get(META_WEBHOOK_SIGNATURE_HEADER),
  });
}
