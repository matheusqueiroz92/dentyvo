import { describe, expect, it } from "vitest";

import { MultiplosNumerosNoWabaNaoSuportadoError } from "../../domain/errors";
import {
  GRAPH_API_VERSION_PADRAO,
  MetaGraphApiAdapter,
} from "./MetaGraphApiAdapter";

const APP_ID = "app-id-teste";
const APP_SECRET = "app-secret-teste";
const CODE = "codigo-oauth";
const TOKEN = "token-de-negocio";
const WABA_ID = "waba-123";

type JsonResponse = { ok: boolean; status?: number; json: unknown };

function fetchPorCaminho(respostas: Record<string, JsonResponse>) {
  const chamadas: string[] = [];
  const fetchFn: typeof fetch = async (input) => {
    const url = input instanceof URL ? input : new URL(String(input));
    chamadas.push(url.pathname);
    const resposta = respostas[url.pathname];
    if (!resposta) {
      throw new Error(`fetch inesperado: ${url.pathname}`);
    }
    return {
      ok: resposta.ok,
      status: resposta.status ?? (resposta.ok ? 200 : 400),
      json: async () => resposta.json,
    } as Response;
  };
  return { fetchFn, chamadas };
}

function respostasComNumeros(
  numeros: Array<{ id: string }>,
): Record<string, JsonResponse> {
  const prefixo = `/${GRAPH_API_VERSION_PADRAO}`;
  return {
    [`${prefixo}/oauth/access_token`]: {
      ok: true,
      json: { access_token: TOKEN, expires_in: 60 * 24 * 60 * 60 },
    },
    [`${prefixo}/debug_token`]: {
      ok: true,
      json: {
        data: {
          is_valid: true,
          granular_scopes: [
            { scope: "whatsapp_business_management", target_ids: [WABA_ID] },
          ],
        },
      },
    },
    [`${prefixo}/${WABA_ID}/phone_numbers`]: {
      ok: true,
      json: { data: numeros },
    },
  };
}

function criarAdapter(fetchFn: typeof fetch) {
  return new MetaGraphApiAdapter({
    appId: APP_ID,
    appSecret: APP_SECRET,
    fetchFn,
  });
}

describe("GRAPH_API_VERSION_PADRAO", () => {
  it("fixa a versão corrente da Graph API (changelog Meta, 2026-08)", () => {
    expect(GRAPH_API_VERSION_PADRAO).toBe("v26.0");
  });
});

describe("MetaGraphApiAdapter.trocarCodigoPorToken — phone_number_id", () => {
  it("usa o único número do WABA", async () => {
    const { fetchFn } = fetchPorCaminho(
      respostasComNumeros([{ id: "phone-unico" }]),
    );

    const resultado = await criarAdapter(fetchFn).trocarCodigoPorToken(CODE);

    expect(resultado.phoneNumberId).toBe("phone-unico");
    expect(resultado.wabaId).toBe(WABA_ID);
  });

  it("rejeita WABA com múltiplos números em vez de pegar o primeiro", async () => {
    const { fetchFn } = fetchPorCaminho(
      respostasComNumeros([{ id: "phone-a" }, { id: "phone-b" }]),
    );

    await expect(
      criarAdapter(fetchFn).trocarCodigoPorToken(CODE),
    ).rejects.toBeInstanceOf(MultiplosNumerosNoWabaNaoSuportadoError);

    await expect(
      criarAdapter(fetchFn).trocarCodigoPorToken(CODE),
    ).rejects.toThrow(/apenas um número/i);
  });

  it("a mensagem explica o que a clínica precisa fazer", async () => {
    const { fetchFn } = fetchPorCaminho(
      respostasComNumeros([{ id: "phone-a" }, { id: "phone-b" }]),
    );

    try {
      await criarAdapter(fetchFn).trocarCodigoPorToken(CODE);
      throw new Error("deveria ter lançado");
    } catch (erro) {
      expect(erro).toBeInstanceOf(MultiplosNumerosNoWabaNaoSuportadoError);
      const dominio = erro as MultiplosNumerosNoWabaNaoSuportadoError;
      expect(dominio.nome).toBe("MultiplosNumerosNoWabaNaoSuportadoError");
      expect(dominio.message).toMatch(/WABA|WhatsApp Business/i);
      expect(dominio.message).toMatch(/um número/i);
      expect(dominio.message).not.toMatch(/phone-a/);
    }
  });
});
