import {
  CodigoOAuthInvalidoError,
  MultiplosNumerosNoWabaNaoSuportadoError,
} from "../../domain/errors";
import type {
  MetaGraphApiPort,
  ResultadoRenovacaoTokenMeta,
  ResultadoTrocaCodigoMeta,
} from "../../application/ports/MetaGraphApiPort";

/** Default único da versão da Graph API — servidor e SDK do browser partilham. */
export const GRAPH_API_VERSION_PADRAO = "v21.0";
/** Fallback quando a Meta não devolve `expires_in` (token de negócio de longa duração). */
const EXPIRACAO_PADRAO_MS = 60 * 24 * 60 * 60 * 1000;

export type MetaGraphApiAdapterConfig = {
  appId: string;
  appSecret: string;
  /** Ex.: `v21.0`. Default: `v21.0`. */
  graphApiVersion?: string;
  /** Injeção para testes; default = `globalThis.fetch`. */
  fetchFn?: typeof fetch;
};

type OauthTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string; code?: number; type?: string };
};

type DebugTokenResponse = {
  data?: {
    is_valid?: boolean;
    granular_scopes?: Array<{
      scope?: string;
      target_ids?: string[];
    }>;
    error?: { message?: string };
  };
  error?: { message?: string };
};

type PhoneNumbersResponse = {
  data?: Array<{ id?: string }>;
  error?: { message?: string };
};

/**
 * Adapter da Meta Graph API / WhatsApp Cloud API (Embedded Signup — spec 008).
 *
 * - `trocarCodigoPorToken`: OAuth code → business token + WABA + phone_number_id
 * - `inscreverWebhook`: `POST /{waba-id}/subscribed_apps`
 * - `renovarToken`: `fb_exchange_token` para estender o token
 */
export class MetaGraphApiAdapter implements MetaGraphApiPort {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly version: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: MetaGraphApiAdapterConfig) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.version = config.graphApiVersion ?? GRAPH_API_VERSION_PADRAO;
    this.fetchFn = config.fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): MetaGraphApiAdapter {
    const appId = env.META_APP_ID?.trim() ?? "";
    const appSecret = env.META_APP_SECRET?.trim() ?? "";
    if (!appId || !appSecret) {
      throw new Error(
        "META_APP_ID e META_APP_SECRET são obrigatórios para MetaGraphApiAdapter.",
      );
    }
    return new MetaGraphApiAdapter({
      appId,
      appSecret,
      graphApiVersion: env.META_GRAPH_API_VERSION?.trim() || undefined,
    });
  }

  async trocarCodigoPorToken(
    codigoOAuth: string,
  ): Promise<ResultadoTrocaCodigoMeta> {
    const code = codigoOAuth.trim();
    if (!code) {
      throw new CodigoOAuthInvalidoError();
    }

    const tokenUrl = new URL(
      `https://graph.facebook.com/${this.version}/oauth/access_token`,
    );
    tokenUrl.searchParams.set("client_id", this.appId);
    tokenUrl.searchParams.set("client_secret", this.appSecret);
    tokenUrl.searchParams.set("code", code);

    const tokenJson = await this.getJson<OauthTokenResponse>(tokenUrl);
    if (!tokenJson.access_token) {
      throw new CodigoOAuthInvalidoError();
    }

    const accessToken = tokenJson.access_token;
    const expiraEm = expiraEmDe(tokenJson.expires_in);

    const wabaId = await this.obterWabaId(accessToken);
    const phoneNumberId = await this.obterPhoneNumberId(wabaId, accessToken);

    return { accessToken, expiraEm, wabaId, phoneNumberId };
  }

  async inscreverWebhook(input: {
    wabaId: string;
    phoneNumberId: string;
    accessToken: string;
  }): Promise<void> {
    const wabaId = input.wabaId.trim();
    if (!wabaId) {
      throw new Error("wabaId é obrigatório para inscrever webhook.");
    }

    // Meta associa o app ao WABA (webhooks de todas as phone numbers da conta).
    const url = new URL(
      `https://graph.facebook.com/${this.version}/${wabaId}/subscribed_apps`,
    );
    const res = await this.fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const json = (await res.json()) as {
      success?: boolean;
      error?: { message?: string };
    };
    if (!res.ok || json.error) {
      throw new Error(
        json.error?.message ??
          `Falha ao insccrever webhook no WABA ${wabaId} (HTTP ${res.status}).`,
      );
    }

    // phoneNumberId é validado/usado no roteamento do webhook; a inscrição é no WABA.
    void input.phoneNumberId;
  }

  async renovarToken(accessToken: string): Promise<ResultadoRenovacaoTokenMeta> {
    const url = new URL(
      `https://graph.facebook.com/${this.version}/oauth/access_token`,
    );
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", this.appId);
    url.searchParams.set("client_secret", this.appSecret);
    url.searchParams.set("fb_exchange_token", accessToken);

    const json = await this.getJson<OauthTokenResponse>(url);
    if (!json.access_token) {
      throw new Error(
        json.error?.message ?? "Falha ao renovar token na Graph API.",
      );
    }

    return {
      accessToken: json.access_token,
      expiraEm: expiraEmDe(json.expires_in),
    };
  }

  private async obterWabaId(customerToken: string): Promise<string> {
    const appToken = `${this.appId}|${this.appSecret}`;
    const url = new URL(
      `https://graph.facebook.com/${this.version}/debug_token`,
    );
    url.searchParams.set("input_token", customerToken);
    url.searchParams.set("access_token", appToken);

    const json = await this.getJson<DebugTokenResponse>(url);
    if (json.error || json.data?.error || json.data?.is_valid === false) {
      throw new CodigoOAuthInvalidoError();
    }

    const targetIds =
      json.data?.granular_scopes?.flatMap((s) => s.target_ids ?? []) ?? [];
    const wabaId = targetIds.find((id) => id.trim().length > 0);
    if (!wabaId) {
      throw new Error(
        "Não foi possível obter waba_id a partir do token (debug_token).",
      );
    }
    return wabaId;
  }

  private async obterPhoneNumberId(
    wabaId: string,
    customerToken: string,
  ): Promise<string> {
    const url = new URL(
      `https://graph.facebook.com/${this.version}/${wabaId}/phone_numbers`,
    );
    const res = await this.fetchFn(url, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const json = (await res.json()) as PhoneNumbersResponse;
    if (!res.ok || json.error) {
      throw new Error(
        json.error?.message ??
          `Falha ao listar phone numbers do WABA ${wabaId}.`,
      );
    }
    const numeros = (json.data ?? []).filter(
      (item): item is { id: string } =>
        typeof item.id === "string" && item.id.trim().length > 0,
    );
    if (numeros.length > 1) {
      throw new MultiplosNumerosNoWabaNaoSuportadoError(wabaId, numeros.length);
    }
    const phoneNumberId = numeros[0]?.id;
    if (!phoneNumberId) {
      throw new Error(`WABA ${wabaId} não possui phone_number_id.`);
    }
    return phoneNumberId;
  }

  private async getJson<T extends { error?: { message?: string } }>(
    url: URL,
  ): Promise<T> {
    const res = await this.fetchFn(url, { method: "GET" });
    const json = (await res.json()) as T;
    if (!res.ok || json.error) {
      // OAuth inválido/expirado — erro de domínio tratável pelo use case.
      if (res.status === 400 || res.status === 401) {
        throw new CodigoOAuthInvalidoError();
      }
      throw new Error(
        json.error?.message ?? `Graph API HTTP ${res.status} em ${url.pathname}`,
      );
    }
    return json;
  }
}

function expiraEmDe(expiresInSegundos: number | undefined): Date {
  const ms =
    typeof expiresInSegundos === "number" && expiresInSegundos > 0
      ? expiresInSegundos * 1000
      : EXPIRACAO_PADRAO_MS;
  return new Date(Date.now() + ms);
}
