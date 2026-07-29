import type {
  AssinaturaGatewayPort,
  CobrancaGatewaySnapshot,
  CriarAssinaturaGatewayInput,
  CriarAssinaturaGatewayResultado,
  CriarClienteGatewayInput,
  CriarClienteGatewayResultado,
} from "../../application/ports/AssinaturaGatewayPort";
import type { MetodoPagamento } from "../../domain/MetodoPagamento";
import type { MetodoPagamentoMvp } from "../../domain/MetodoPagamento";
import type { StatusCobranca } from "../../domain/StatusCobranca";

const DEFAULT_BASE_URL = "https://api-sandbox.asaas.com/v3";

export type AsaasGatewayAdapterConfig = {
  apiKey: string;
  /** Ex.: https://api-sandbox.asaas.com/v3 ou https://api.asaas.com/v3 */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

type AsaasPaymentJson = {
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

/**
 * Adapter concreto Asaas — único lugar com endpoints/billingType do provedor.
 * Implementa `AssinaturaGatewayPort` com vocabulário genérico na fronteira.
 */
export class AsaasGatewayAdapter implements AssinaturaGatewayPort {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: AsaasGatewayAdapterConfig) {
    const apiKey = config.apiKey.trim();
    if (!apiKey) {
      throw new Error("ASAAS_API_KEY é obrigatória para AsaasGatewayAdapter.");
    }
    this.apiKey = apiKey;
    this.baseUrl = (config.baseUrl?.trim() || DEFAULT_BASE_URL).replace(
      /\/$/,
      "",
    );
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async criarCliente(
    input: CriarClienteGatewayInput,
  ): Promise<CriarClienteGatewayResultado> {
    const body = await this.request<{ id: string }>("POST", "/customers", {
      name: input.nome,
      email: input.email,
      cpfCnpj: input.cpfCnpj,
      externalReference: input.referenciaExterna,
    });
    return { gatewayClienteId: body.id };
  }

  async criarAssinatura(
    input: CriarAssinaturaGatewayInput,
  ): Promise<CriarAssinaturaGatewayResultado> {
    const body = await this.request<{ id: string; nextDueDate?: string }>(
      "POST",
      "/subscriptions",
      {
        customer: input.gatewayClienteId,
        billingType: toAsaasBillingType(input.metodo),
        value: input.valorMensal,
        nextDueDate: toDateOnly(input.proximoVencimento),
        cycle: "MONTHLY",
        description: input.descricao,
      },
    );
    return {
      gatewayAssinaturaId: body.id,
      dataProximaCobranca: body.nextDueDate
        ? parseDateOnly(body.nextDueDate)
        : input.proximoVencimento,
    };
  }

  async cancelarAssinatura(gatewayAssinaturaId: string): Promise<void> {
    await this.request(
      "DELETE",
      `/subscriptions/${encodeURIComponent(gatewayAssinaturaId)}`,
    );
  }

  /**
   * Spec 012 — atualiza `value` da subscription Asaas (vocabulário Asaas
   * confinado aqui; a port usa `gatewayAssinaturaId` + `valorMensal`).
   */
  async atualizarValorAssinatura(input: {
    gatewayAssinaturaId: string;
    valorMensal: number;
  }): Promise<void> {
    await this.request(
      "PUT",
      `/subscriptions/${encodeURIComponent(input.gatewayAssinaturaId)}`,
      {
        value: input.valorMensal,
        updatePendingPayments: true,
      },
    );
  }

  async consultarCobranca(
    gatewayCobrancaId: string,
  ): Promise<CobrancaGatewaySnapshot> {
    const body = await this.request<AsaasPaymentJson>(
      "GET",
      `/payments/${encodeURIComponent(gatewayCobrancaId)}`,
    );
    return toCobrancaSnapshot(body);
  }

  async listarCobrancasDaAssinatura(
    gatewayAssinaturaId: string,
  ): Promise<CobrancaGatewaySnapshot[]> {
    const body = await this.request<{ data?: AsaasPaymentJson[] }>(
      "GET",
      `/subscriptions/${encodeURIComponent(gatewayAssinaturaId)}/payments`,
    );
    return (body.data ?? []).map(toCobrancaSnapshot);
  }

  private async request<T>(
    method: string,
    path: string,
    payload?: unknown,
  ): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        access_token: this.apiKey,
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });

    if (!response.ok) {
      const texto = await response.text().catch(() => "");
      throw new Error(
        `Asaas API ${method} ${path} falhou (${response.status}): ${texto}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}

function toAsaasBillingType(metodo: MetodoPagamentoMvp): "PIX" | "BOLETO" {
  if (metodo === "pix") return "PIX";
  return "BOLETO";
}

function fromAsaasBillingType(billingType: string | undefined): MetodoPagamento {
  switch ((billingType ?? "").toUpperCase()) {
    case "PIX":
      return "pix";
    case "BOLETO":
      return "boleto";
    case "CREDIT_CARD":
    case "DEBIT_CARD":
      return "cartao";
    default:
      return "pix";
  }
}

function fromAsaasPaymentStatus(status: string | undefined): StatusCobranca {
  switch ((status ?? "").toUpperCase()) {
    case "PENDING":
    case "AWAITING_RISK_ANALYSIS":
      return "pendente";
    case "RECEIVED":
    case "CONFIRMED":
    case "RECEIVED_IN_CASH":
      return "paga";
    case "OVERDUE":
      return "vencida";
    case "REFUNDED":
    case "REFUND_REQUESTED":
    case "REFUND_IN_PROGRESS":
      return "estornada";
    default:
      return "pendente";
  }
}

function toCobrancaSnapshot(payment: AsaasPaymentJson): CobrancaGatewaySnapshot {
  if (!payment.id) {
    throw new Error("Resposta Asaas sem id de cobrança.");
  }
  const link =
    payment.invoiceUrl ?? payment.bankSlipUrl ?? null;
  return {
    gatewayCobrancaId: payment.id,
    gatewayAssinaturaId: payment.subscription ?? null,
    valor: typeof payment.value === "number" ? payment.value : 0,
    metodo: fromAsaasBillingType(payment.billingType),
    status: fromAsaasPaymentStatus(payment.status),
    vencimento: payment.dueDate
      ? parseDateOnly(payment.dueDate)
      : new Date(),
    pagaEm: payment.paymentDate
      ? parseDateOnly(payment.paymentDate)
      : payment.clientPaymentDate
        ? parseDateOnly(payment.clientPaymentDate)
        : null,
    linkPagamento: link,
  };
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(value: string): Date {
  // Asaas envia YYYY-MM-DD; interpreta como UTC midnight.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data Asaas inválida: ${value}`);
  }
  return parsed;
}
