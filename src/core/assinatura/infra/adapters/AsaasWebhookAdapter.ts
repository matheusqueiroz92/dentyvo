import { EventoCobranca } from "../../domain/EventoCobranca";
import type { MetodoPagamento } from "../../domain/MetodoPagamento";
import type { StatusCobranca } from "../../domain/StatusCobranca";

/** Header oficial do Asaas para o token de autenticação do webhook. */
export const ASAAS_WEBHOOK_HEADER = "asaas-access-token";

const EVENTOS_SUPORTADOS = new Set([
  "PAYMENT_CREATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REFUNDED",
]);

export class WebhookTokenInvalidoError extends Error {
  readonly nome = "WebhookTokenInvalidoError" as const;

  constructor() {
    super("Token do webhook Asaas inválido ou ausente.");
    this.name = this.nome;
  }
}

export type AsaasWebhookAdapterConfig = {
  /** Valor de `ASAAS_WEBHOOK_TOKEN` — comparado ao header asaas-access-token. */
  webhookToken: string;
};

type AsaasWebhookPayment = {
  id?: string;
  subscription?: string | null;
  value?: number;
  billingType?: string;
  status?: string;
  dueDate?: string;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
};

type AsaasWebhookBody = {
  id?: string;
  event?: string;
  dateCreated?: string;
  payment?: AsaasWebhookPayment;
};

/**
 * Boundary HTTP do Asaas: valida `asaas-access-token` e traduz o payload
 * para `EventoCobranca` (vocabulário do domínio). Nada disso vaza para
 * `application/`.
 */
export class AsaasWebhookAdapter {
  private readonly webhookToken: string;

  constructor(config: AsaasWebhookAdapterConfig) {
    const token = config.webhookToken.trim();
    if (!token) {
      throw new Error(
        "ASAAS_WEBHOOK_TOKEN é obrigatório para AsaasWebhookAdapter.",
      );
    }
    this.webhookToken = token;
  }

  /**
   * Valida o header `asaas-access-token` contra o segredo configurado.
   */
  validarToken(headerValue: string | null | undefined): void {
    if (headerValue == null || headerValue !== this.webhookToken) {
      throw new WebhookTokenInvalidoError();
    }
  }

  /**
   * Traduz o body bruto do Asaas. Retorna `null` para eventos ignorados
   * (fora do MVP), sem lançar — a rota pode responder 200.
   */
  traduzirParaEventoCobranca(body: unknown): EventoCobranca | null {
    const payload = body as AsaasWebhookBody;
    const eventName = payload.event?.trim() ?? "";
    if (!EVENTOS_SUPORTADOS.has(eventName)) {
      return null;
    }

    const payment = payload.payment;
    if (!payment?.id) {
      throw new Error("Webhook Asaas sem payment.id.");
    }

    const eventoId = (payload.id ?? "").trim();
    if (!eventoId) {
      throw new Error("Webhook Asaas sem id de evento.");
    }

    return EventoCobranca.criar({
      eventoId,
      gatewayCobrancaId: payment.id,
      gatewayAssinaturaId: payment.subscription ?? null,
      status: statusDoEvento(eventName, payment.status),
      valor: typeof payment.value === "number" ? payment.value : 0,
      metodo: metodoDoBillingType(payment.billingType),
      vencimento: payment.dueDate
        ? parseDate(payment.dueDate)
        : new Date(),
      pagaEm: payment.paymentDate
        ? parseDate(payment.paymentDate)
        : payment.clientPaymentDate
          ? parseDate(payment.clientPaymentDate)
          : null,
      linkPagamento: payment.invoiceUrl ?? payment.bankSlipUrl ?? null,
      ocorridoEm: payload.dateCreated
        ? parseDate(payload.dateCreated)
        : new Date(),
    });
  }
}

function statusDoEvento(
  eventName: string,
  paymentStatus: string | undefined,
): StatusCobranca {
  switch (eventName) {
    case "PAYMENT_CREATED":
      return "pendente";
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      return "paga";
    case "PAYMENT_OVERDUE":
      return "vencida";
    case "PAYMENT_REFUNDED":
      return "estornada";
    default:
      return fromPaymentStatus(paymentStatus);
  }
}

function fromPaymentStatus(status: string | undefined): StatusCobranca {
  switch ((status ?? "").toUpperCase()) {
    case "OVERDUE":
      return "vencida";
    case "RECEIVED":
    case "CONFIRMED":
      return "paga";
    case "REFUNDED":
      return "estornada";
    default:
      return "pendente";
  }
}

function metodoDoBillingType(billingType: string | undefined): MetodoPagamento {
  switch ((billingType ?? "").toUpperCase()) {
    case "BOLETO":
      return "boleto";
    case "CREDIT_CARD":
    case "DEBIT_CARD":
      return "cartao";
    case "PIX":
    default:
      return "pix";
  }
}

function parseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data de webhook Asaas inválida: ${value}`);
  }
  return parsed;
}
