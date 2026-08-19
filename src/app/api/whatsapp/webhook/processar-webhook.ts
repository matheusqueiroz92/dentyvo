import type {
  MetaWebhookAdapter,
  VerificacaoWebhookInvalidaError,
} from "@/core/whatsapp-bot/infra/adapters";
import type { RotearEventoWhatsappOutput } from "@/core/whatsapp-bot/application/use-cases";

/** Contrato mínimo consumido da camada de aplicação (facilita o teste da rota). */
export type RoteadorEventoWhatsapp = {
  executar(input: {
    phoneNumberIds: string[];
  }): Promise<RotearEventoWhatsappOutput>;
};

export type ProcessarEventoWebhookInput = {
  webhook: MetaWebhookAdapter;
  rotear: RoteadorEventoWhatsapp;
  /** Corpo **bruto** — a assinatura é calculada sobre os bytes recebidos. */
  rawBody: string;
  assinatura: string | null | undefined;
};

/**
 * Handshake `GET` de verificação da Callback URL (Meta App Dashboard).
 * Responde o `hub.challenge` em texto plano, ou 403 se a verificação falha.
 */
export function responderHandshakeWebhook(
  webhook: MetaWebhookAdapter,
  url: URL,
): Response {
  try {
    const challenge = webhook.verificarHandshake({
      mode: url.searchParams.get("hub.mode"),
      verifyToken: url.searchParams.get("hub.verify_token"),
      challenge: url.searchParams.get("hub.challenge"),
    });

    return new Response(challenge, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (erro) {
    console.warn("[whatsapp:webhook] handshake rejeitado", {
      codigo: (erro as VerificacaoWebhookInvalidaError).nome,
    });
    return new Response(null, { status: 403 });
  }
}

/**
 * Eventos inbound da Cloud API.
 *
 * Códigos de resposta (definem se a Meta reentrega o lote):
 * - 401: assinatura ausente/inválida — nada é processado.
 * - 200: payload aceito, inclusive quando o `phone_number_id` é desconhecido
 *   ou o corpo é inválido. Reentrega não resolveria e só geraria retry storm.
 * - 500: falha nossa de infraestrutura — aí a reentrega da Meta é desejável.
 */
export async function processarEventoWebhook(
  input: ProcessarEventoWebhookInput,
): Promise<Response> {
  try {
    input.webhook.validarAssinatura(input.rawBody, input.assinatura);
  } catch {
    console.warn("[whatsapp:webhook] assinatura inválida; payload descartado");
    return new Response(null, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = JSON.parse(input.rawBody);
  } catch {
    console.warn("[whatsapp:webhook] corpo assinado não é JSON válido");
    return new Response(null, { status: 200 });
  }

  const phoneNumberIds = input.webhook.extrairPhoneNumberIds(corpo);
  if (phoneNumberIds.length === 0) {
    return new Response(null, { status: 200 });
  }

  try {
    await input.rotear.executar({ phoneNumberIds });
  } catch (erro) {
    // Erro nosso (ex.: banco indisponível): 500 para a Meta reentregar.
    console.error("[whatsapp:webhook] falha ao rotear evento", erro);
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 200 });
}
