import { describe, expect, it } from "vitest";

import {
  ASAAS_WEBHOOK_HEADER,
  AsaasWebhookAdapter,
  WebhookTokenInvalidoError,
} from "./AsaasWebhookAdapter";

const TOKEN = "whsec_token_de_teste_com_mais_de_32_chars";

describe("AsaasWebhookAdapter", () => {
  const sut = new AsaasWebhookAdapter({ webhookToken: TOKEN });

  it("rejeita token ausente ou divergente no header asaas-access-token", () => {
    expect(() => sut.validarToken(undefined)).toThrow(WebhookTokenInvalidoError);
    expect(() => sut.validarToken("outro")).toThrow(WebhookTokenInvalidoError);
    expect(() => sut.validarToken(TOKEN)).not.toThrow();
    expect(ASAAS_WEBHOOK_HEADER).toBe("asaas-access-token");
  });

  it("traduz PAYMENT_RECEIVED para EventoCobranca paga/pix", () => {
    const evento = sut.traduzirParaEventoCobranca({
      id: "evt_abc123",
      event: "PAYMENT_RECEIVED",
      dateCreated: "2026-07-14 15:00:00",
      payment: {
        id: "pay_1",
        subscription: "sub_1",
        value: 99.9,
        billingType: "PIX",
        status: "RECEIVED",
        dueDate: "2026-07-15",
        paymentDate: "2026-07-14",
        invoiceUrl: "https://exemplo/fatura",
      },
    });

    expect(evento).not.toBeNull();
    expect(evento!.eventoId).toBe("evt_abc123");
    expect(evento!.status).toBe("paga");
    expect(evento!.metodo).toBe("pix");
    expect(evento!.gatewayAssinaturaId).toBe("sub_1");
  });

  it("traduz PAYMENT_OVERDUE para vencida e PAYMENT_REFUNDED para estornada", () => {
    const vencida = sut.traduzirParaEventoCobranca({
      id: "evt_over",
      event: "PAYMENT_OVERDUE",
      payment: {
        id: "pay_2",
        billingType: "BOLETO",
        value: 10,
        dueDate: "2026-07-15",
      },
    });
    expect(vencida?.status).toBe("vencida");
    expect(vencida?.metodo).toBe("boleto");

    const estornada = sut.traduzirParaEventoCobranca({
      id: "evt_ref",
      event: "PAYMENT_REFUNDED",
      payment: {
        id: "pay_3",
        billingType: "PIX",
        value: 10,
        dueDate: "2026-07-15",
      },
    });
    expect(estornada?.status).toBe("estornada");
  });

  it("ignora eventos fora do MVP (retorna null)", () => {
    expect(
      sut.traduzirParaEventoCobranca({
        id: "evt_x",
        event: "PAYMENT_DELETED",
        payment: { id: "pay_x", value: 1, dueDate: "2026-07-15" },
      }),
    ).toBeNull();
  });
});
