import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";

import { MetaWebhookAdapter } from "@/core/whatsapp-bot/infra/adapters";

import {
  executarHandshakeGet,
  processarEventoWebhook,
  responderHandshakeWebhook,
} from "./processar-webhook";

const APP_SECRET = "app-secret-de-teste";
const VERIFY_TOKEN = "verify-token-de-teste";

const webhook = new MetaWebhookAdapter({
  appSecret: APP_SECRET,
  verifyToken: VERIFY_TOKEN,
});

function assinar(rawBody: string, secret = APP_SECRET) {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

function payload(...phoneNumberIds: string[]) {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: phoneNumberIds.map((phoneNumberId) => ({
      id: "waba-1",
      changes: [
        {
          field: "messages",
          value: { metadata: { phone_number_id: phoneNumberId } },
        },
      ],
    })),
  });
}

function urlDeHandshake(params: Record<string, string>) {
  const url = new URL("https://dentyvo.com.br/api/whatsapp/webhook");
  for (const [chave, valor] of Object.entries(params)) {
    url.searchParams.set(chave, valor);
  }
  return url;
}

function roteadorFake(reconhecidos: string[] = []) {
  return {
    executar: vi.fn(async ({ phoneNumberIds }: { phoneNumberIds: string[] }) => ({
      reconhecidos: phoneNumberIds
        .filter((id) => reconhecidos.includes(id))
        .map((id) => ({ phoneNumberId: id, clinicaId: `clinica-${id}` })),
      descartados: phoneNumberIds.filter((id) => !reconhecidos.includes(id)),
    })),
  };
}

describe("responderHandshakeWebhook", () => {
  it("ecoa o challenge em texto plano quando a verificação confere", async () => {
    const res = responderHandshakeWebhook(
      webhook,
      urlDeHandshake({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "desafio-123",
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("desafio-123");
  });

  it("responde 403 para verify token divergente", () => {
    const res = responderHandshakeWebhook(
      webhook,
      urlDeHandshake({
        "hub.mode": "subscribe",
        "hub.verify_token": "token-errado",
        "hub.challenge": "desafio-123",
      }),
    );

    expect(res.status).toBe(403);
  });

  it("responde 403 quando faltam parâmetros do handshake", () => {
    const res = responderHandshakeWebhook(
      webhook,
      urlDeHandshake({ "hub.mode": "subscribe" }),
    );

    expect(res.status).toBe(403);
  });
});

describe("executarHandshakeGet — configuração de ambiente", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sem META_WEBHOOK_VERIFY_TOKEN responde 500 tratado, loga a variável e não lança", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = executarHandshakeGet(
      urlDeHandshake({
        "hub.mode": "subscribe",
        "hub.verify_token": "qualquer",
        "hub.challenge": "teste123",
      }),
      { META_APP_SECRET: APP_SECRET },
    );

    expect(res.status).toBe(500);
    expect(error).toHaveBeenCalledWith(
      "[whatsapp:webhook]",
      expect.stringContaining("META_WEBHOOK_VERIFY_TOKEN não configurada"),
    );
  });

  it("com token correto ecoa o challenge mesmo sem META_APP_SECRET", async () => {
    const res = executarHandshakeGet(
      urlDeHandshake({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "teste123",
      }),
      { META_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN },
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("teste123");
    expect(res.headers.get("content-type")).toMatch(/text\/plain/);
  });

  it("com token divergente responde 403, não 500", () => {
    const res = executarHandshakeGet(
      urlDeHandshake({
        "hub.mode": "subscribe",
        "hub.verify_token": "token-errado",
        "hub.challenge": "teste123",
      }),
      { META_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN },
    );

    expect(res.status).toBe(403);
  });
});

describe("processarEventoWebhook", () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("responde 401 sem rotear quando a assinatura é inválida", async () => {
    const rotear = roteadorFake(["phone-a"]);
    const rawBody = payload("phone-a");

    const res = await processarEventoWebhook({
      webhook,
      rotear,
      rawBody,
      assinatura: assinar(rawBody, "segredo-do-atacante"),
    });

    expect(res.status).toBe(401);
    expect(rotear.executar).not.toHaveBeenCalled();
  });

  it("responde 401 quando o header de assinatura está ausente", async () => {
    const rotear = roteadorFake();

    const res = await processarEventoWebhook({
      webhook,
      rotear,
      rawBody: payload("phone-a"),
      assinatura: null,
    });

    expect(res.status).toBe(401);
    expect(rotear.executar).not.toHaveBeenCalled();
  });

  it("responde 200 e roteia o phone_number_id conhecido", async () => {
    const rotear = roteadorFake(["phone-a"]);
    const rawBody = payload("phone-a");

    const res = await processarEventoWebhook({
      webhook,
      rotear,
      rawBody,
      assinatura: assinar(rawBody),
    });

    expect(res.status).toBe(200);
    expect(rotear.executar).toHaveBeenCalledWith({
      phoneNumberIds: ["phone-a"],
    });
  });

  it("responde 200 para phone_number_id desconhecido (Meta não deve retentar)", async () => {
    const rotear = roteadorFake([]);
    const rawBody = payload("phone-desconhecido");

    const res = await processarEventoWebhook({
      webhook,
      rotear,
      rawBody,
      assinatura: assinar(rawBody),
    });

    expect(res.status).toBe(200);
  });

  it("processa clínicas simultâneas e segue com as conhecidas mesmo havendo descarte", async () => {
    const rotear = roteadorFake(["phone-a", "phone-b"]);
    const rawBody = payload("phone-a", "phone-desconhecido", "phone-b");

    const res = await processarEventoWebhook({
      webhook,
      rotear,
      rawBody,
      assinatura: assinar(rawBody),
    });

    expect(res.status).toBe(200);
    expect(rotear.executar).toHaveBeenCalledWith({
      phoneNumberIds: ["phone-a", "phone-desconhecido", "phone-b"],
    });
    await expect(rotear.executar.mock.results[0]?.value).resolves.toMatchObject({
      reconhecidos: [
        { phoneNumberId: "phone-a", clinicaId: "clinica-phone-a" },
        { phoneNumberId: "phone-b", clinicaId: "clinica-phone-b" },
      ],
      descartados: ["phone-desconhecido"],
    });
  });

  it("responde 200 e loga quando o corpo assinado não é JSON válido", async () => {
    const rotear = roteadorFake();
    const rawBody = "isto-nao-e-json";

    const res = await processarEventoWebhook({
      webhook,
      rotear,
      rawBody,
      assinatura: assinar(rawBody),
    });

    expect(res.status).toBe(200);
    expect(rotear.executar).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("responde 500 quando o roteamento falha por erro de infraestrutura", async () => {
    const rotear = {
      executar: vi.fn().mockRejectedValue(new Error("conexão com o banco caiu")),
    };
    const rawBody = payload("phone-a");

    const res = await processarEventoWebhook({
      webhook,
      rotear,
      rawBody,
      assinatura: assinar(rawBody),
    });

    expect(res.status).toBe(500);
  });

  it("nunca ecoa o corpo recebido na resposta", async () => {
    const rotear = roteadorFake(["phone-a"]);
    const rawBody = payload("phone-a");

    const res = await processarEventoWebhook({
      webhook,
      rotear,
      rawBody,
      assinatura: assinar(rawBody),
    });

    expect(await res.text()).not.toContain("phone-a");
  });
});
