import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  AssinaturaWebhookInvalidaError,
  META_WEBHOOK_SIGNATURE_HEADER,
  MetaWebhookAdapter,
  VerificacaoWebhookInvalidaError,
} from "./MetaWebhookAdapter";

const APP_SECRET = "app-secret-de-teste";
const VERIFY_TOKEN = "verify-token-de-teste";

function criarAdapter() {
  return new MetaWebhookAdapter({
    appSecret: APP_SECRET,
    verifyToken: VERIFY_TOKEN,
  });
}

function assinar(rawBody: string, secret = APP_SECRET) {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

describe("MetaWebhookAdapter", () => {
  describe("construtor", () => {
    it("exige appSecret e verifyToken", () => {
      expect(
        () => new MetaWebhookAdapter({ appSecret: " ", verifyToken: VERIFY_TOKEN }),
      ).toThrow(/META_APP_SECRET/);
      expect(
        () => new MetaWebhookAdapter({ appSecret: APP_SECRET, verifyToken: "" }),
      ).toThrow(/META_WEBHOOK_VERIFY_TOKEN/);
    });
  });

  describe("verificarHandshake", () => {
    it("ecoa o challenge quando mode e verify token conferem", () => {
      const challenge = criarAdapter().verificarHandshake({
        mode: "subscribe",
        verifyToken: VERIFY_TOKEN,
        challenge: "1234567890",
      });

      expect(challenge).toBe("1234567890");
    });

    it("rejeita verify token divergente", () => {
      expect(() =>
        criarAdapter().verificarHandshake({
          mode: "subscribe",
          verifyToken: "token-errado",
          challenge: "123",
        }),
      ).toThrow(VerificacaoWebhookInvalidaError);
    });

    it("rejeita mode diferente de subscribe", () => {
      expect(() =>
        criarAdapter().verificarHandshake({
          mode: "unsubscribe",
          verifyToken: VERIFY_TOKEN,
          challenge: "123",
        }),
      ).toThrow(VerificacaoWebhookInvalidaError);
    });

    it("rejeita ausência de challenge", () => {
      expect(() =>
        criarAdapter().verificarHandshake({
          mode: "subscribe",
          verifyToken: VERIFY_TOKEN,
          challenge: null,
        }),
      ).toThrow(VerificacaoWebhookInvalidaError);
    });
  });

  describe("validarAssinatura", () => {
    it("aceita assinatura HMAC-SHA256 correta do corpo bruto", () => {
      const rawBody = JSON.stringify({ object: "whatsapp_business_account" });

      expect(() =>
        criarAdapter().validarAssinatura(rawBody, assinar(rawBody)),
      ).not.toThrow();
    });

    it("rejeita assinatura calculada com outro segredo", () => {
      const rawBody = JSON.stringify({ object: "whatsapp_business_account" });

      expect(() =>
        criarAdapter().validarAssinatura(
          rawBody,
          assinar(rawBody, "segredo-do-atacante"),
        ),
      ).toThrow(AssinaturaWebhookInvalidaError);
    });

    it("rejeita assinatura de um corpo diferente do recebido", () => {
      const assinatura = assinar(JSON.stringify({ a: 1 }));

      expect(() =>
        criarAdapter().validarAssinatura(JSON.stringify({ a: 2 }), assinatura),
      ).toThrow(AssinaturaWebhookInvalidaError);
    });

    it("rejeita header ausente, vazio ou sem o prefixo sha256=", () => {
      const rawBody = "{}";
      const adapter = criarAdapter();

      expect(() => adapter.validarAssinatura(rawBody, null)).toThrow(
        AssinaturaWebhookInvalidaError,
      );
      expect(() => adapter.validarAssinatura(rawBody, "")).toThrow(
        AssinaturaWebhookInvalidaError,
      );
      expect(() =>
        adapter.validarAssinatura(
          rawBody,
          createHmac("sha256", APP_SECRET).update(rawBody).digest("hex"),
        ),
      ).toThrow(AssinaturaWebhookInvalidaError);
    });

    it("rejeita hex de tamanho divergente sem estourar erro de buffer", () => {
      expect(() => criarAdapter().validarAssinatura("{}", "sha256=abc")).toThrow(
        AssinaturaWebhookInvalidaError,
      );
    });

    it("expõe o header oficial usado pela Meta", () => {
      expect(META_WEBHOOK_SIGNATURE_HEADER).toBe("x-hub-signature-256");
    });
  });

  describe("extrairPhoneNumberIds", () => {
    it("extrai o phone_number_id de cada change do payload", () => {
      const ids = criarAdapter().extrairPhoneNumberIds({
        object: "whatsapp_business_account",
        entry: [
          {
            id: "waba-1",
            changes: [
              {
                field: "messages",
                value: {
                  metadata: {
                    display_phone_number: "5511999999999",
                    phone_number_id: "phone-1",
                  },
                },
              },
            ],
          },
        ],
      });

      expect(ids).toEqual(["phone-1"]);
    });

    it("preserva phone_number_id de clínicas distintas no mesmo payload", () => {
      const ids = criarAdapter().extrairPhoneNumberIds({
        entry: [
          {
            changes: [
              { value: { metadata: { phone_number_id: "phone-clinica-a" } } },
              { value: { metadata: { phone_number_id: "phone-clinica-b" } } },
            ],
          },
          {
            changes: [
              { value: { metadata: { phone_number_id: "phone-clinica-c" } } },
            ],
          },
        ],
      });

      expect(ids).toEqual([
        "phone-clinica-a",
        "phone-clinica-b",
        "phone-clinica-c",
      ]);
    });

    it("não repete o mesmo phone_number_id", () => {
      const ids = criarAdapter().extrairPhoneNumberIds({
        entry: [
          {
            changes: [
              { value: { metadata: { phone_number_id: "phone-1" } } },
              { value: { metadata: { phone_number_id: "phone-1" } } },
            ],
          },
        ],
      });

      expect(ids).toEqual(["phone-1"]);
    });

    it("devolve lista vazia para payload sem metadata utilizável", () => {
      const adapter = criarAdapter();

      expect(adapter.extrairPhoneNumberIds({})).toEqual([]);
      expect(adapter.extrairPhoneNumberIds(null)).toEqual([]);
      expect(adapter.extrairPhoneNumberIds({ entry: [{ changes: [{}] }] })).toEqual(
        [],
      );
      expect(
        adapter.extrairPhoneNumberIds({
          entry: [{ changes: [{ value: { metadata: { phone_number_id: "  " } } }] }],
        }),
      ).toEqual([]);
    });
  });
});
