import { createHmac, timingSafeEqual } from "node:crypto";

/** Header oficial da Meta com o HMAC-SHA256 do corpo bruto. */
export const META_WEBHOOK_SIGNATURE_HEADER = "x-hub-signature-256";

const PREFIXO_ASSINATURA = "sha256=";

export class VerificacaoWebhookInvalidaError extends Error {
  readonly nome = "VerificacaoWebhookInvalidaError" as const;

  constructor() {
    super("Handshake de verificação do webhook WhatsApp rejeitado.");
    this.name = this.nome;
  }
}

export class AssinaturaWebhookInvalidaError extends Error {
  readonly nome = "AssinaturaWebhookInvalidaError" as const;

  constructor() {
    super("Assinatura do webhook WhatsApp inválida ou ausente.");
    this.name = this.nome;
  }
}

/** Falha alta e explícita — variável de ambiente ausente, não crash opaco. */
export class WebhookWhatsappNaoConfiguradoError extends Error {
  readonly nome = "WebhookWhatsappNaoConfiguradoError" as const;

  constructor(variavel: string) {
    super(`${variavel} não configurada`);
    this.name = this.nome;
  }
}

export type MetaWebhookAdapterConfig = {
  /** `META_APP_SECRET` — chave do HMAC que a Meta usa para assinar o payload. */
  appSecret: string;
  /** `META_WEBHOOK_VERIFY_TOKEN` — segredo do handshake `GET`. */
  verifyToken: string;
};

type MetaWebhookChange = {
  value?: {
    metadata?: {
      phone_number_id?: unknown;
    };
  };
};

type MetaWebhookEntry = {
  changes?: MetaWebhookChange[];
};

type MetaWebhookBody = {
  entry?: MetaWebhookEntry[];
};

/**
 * Boundary HTTP do webhook da Meta Cloud API (specs 007/008): valida o
 * handshake de verificação, valida a assinatura do payload e extrai os
 * `phone_number_id` que identificam a clínica destinatária.
 *
 * Nada de vocabulário HTTP da Meta vaza para `application/`.
 */
export class MetaWebhookAdapter {
  private readonly appSecret: string;
  private readonly verifyToken: string;

  constructor(config: MetaWebhookAdapterConfig) {
    this.appSecret = config.appSecret.trim();
    const verifyToken = config.verifyToken.trim();
    if (!verifyToken) {
      throw new WebhookWhatsappNaoConfiguradoError("META_WEBHOOK_VERIFY_TOKEN");
    }
    this.verifyToken = verifyToken;
  }

  /**
   * Handshake GET: só precisa do verify token. `META_APP_SECRET` entra no POST.
   */
  static fromEnvParaHandshake(
    env: NodeJS.ProcessEnv = process.env,
  ): MetaWebhookAdapter {
    return new MetaWebhookAdapter({
      appSecret: env.META_APP_SECRET ?? "",
      verifyToken: env.META_WEBHOOK_VERIFY_TOKEN ?? "",
    });
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): MetaWebhookAdapter {
    const appSecret = env.META_APP_SECRET?.trim() ?? "";
    if (!appSecret) {
      throw new WebhookWhatsappNaoConfiguradoError("META_APP_SECRET");
    }
    return new MetaWebhookAdapter({
      appSecret,
      verifyToken: env.META_WEBHOOK_VERIFY_TOKEN ?? "",
    });
  }

  /**
   * Handshake `GET` exigido pela Meta ao cadastrar a Callback URL.
   * Retorna o `hub.challenge` a ser ecoado; lança se a verificação falha.
   */
  verificarHandshake(input: {
    mode: string | null | undefined;
    verifyToken: string | null | undefined;
    challenge: string | null | undefined;
  }): string {
    const challenge = input.challenge?.trim() ?? "";
    if (input.mode !== "subscribe" || !challenge) {
      throw new VerificacaoWebhookInvalidaError();
    }
    if (!comparacaoSegura(input.verifyToken ?? "", this.verifyToken)) {
      throw new VerificacaoWebhookInvalidaError();
    }
    return challenge;
  }

  /**
   * Valida `x-hub-signature-256` contra o HMAC do corpo **bruto** — precisa ser
   * a string exata recebida, não o JSON reserializado.
   */
  validarAssinatura(
    rawBody: string,
    headerValue: string | null | undefined,
  ): void {
    if (!this.appSecret) {
      throw new WebhookWhatsappNaoConfiguradoError("META_APP_SECRET");
    }
    const header = headerValue?.trim() ?? "";
    if (!header.startsWith(PREFIXO_ASSINATURA)) {
      throw new AssinaturaWebhookInvalidaError();
    }

    const esperado = createHmac("sha256", this.appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    if (!comparacaoSegura(header.slice(PREFIXO_ASSINATURA.length), esperado)) {
      throw new AssinaturaWebhookInvalidaError();
    }
  }

  /**
   * `phone_number_id` distintos presentes no payload, na ordem de chegada.
   * Um único payload pode conter eventos de clínicas diferentes; o caller
   * resolve cada um separadamente.
   */
  extrairPhoneNumberIds(body: unknown): string[] {
    const entries = (body as MetaWebhookBody | null)?.entry;
    if (!Array.isArray(entries)) {
      return [];
    }

    const ids = new Set<string>();
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const bruto = change?.value?.metadata?.phone_number_id;
        if (typeof bruto === "string" && bruto.trim()) {
          ids.add(bruto.trim());
        }
      }
    }
    return [...ids];
  }
}

/** Comparação de tempo constante tolerante a tamanhos divergentes. */
function comparacaoSegura(recebido: string, esperado: string): boolean {
  const a = Buffer.from(recebido, "utf8");
  const b = Buffer.from(esperado, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
