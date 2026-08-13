import { describe, expect, it } from "vitest";

import { Cobranca } from "./Cobranca";
import { LIMITE_HISTORICO_COBRANCA_PAINEL } from "./constants";
import {
  montarHistoricoCobranca,
  paraItemHistoricoCobranca,
  resolverLinkRegularizacao,
  selecionarCobrancasRecentes,
} from "./DetalhesAssinatura";

function cobranca(input: {
  id: string;
  vencimento: string;
  status?: "pendente" | "paga" | "vencida" | "estornada";
  linkPagamento?: string | null;
}) {
  return Cobranca.criar({
    id: input.id,
    assinaturaId: "ass-1",
    gatewayCobrancaId: `gw-${input.id}`,
    valor: 59.9,
    metodo: "pix",
    vencimento: new Date(input.vencimento),
    status: input.status,
    linkPagamento: input.linkPagamento,
  });
}

describe("helpers de DetalhesAssinatura (painel — P5/P9)", () => {
  it("limita o histórico a 12 cobranças mais recentes por vencimento desc", () => {
    const cobrancas = Array.from({ length: 15 }, (_, i) => {
      const dia = String(i + 1).padStart(2, "0");
      return cobranca({
        id: `cob-${dia}`,
        vencimento: `2026-01-${dia}T12:00:00.000Z`,
      });
    });

    const selecionadas = selecionarCobrancasRecentes(cobrancas);
    expect(selecionadas).toHaveLength(LIMITE_HISTORICO_COBRANCA_PAINEL);
    expect(selecionadas.map((c) => c.id)).toEqual([
      "cob-15",
      "cob-14",
      "cob-13",
      "cob-12",
      "cob-11",
      "cob-10",
      "cob-09",
      "cob-08",
      "cob-07",
      "cob-06",
      "cob-05",
      "cob-04",
    ]);
  });

  it("histórico vazio permanece vazio", () => {
    expect(montarHistoricoCobranca([])).toEqual([]);
  });

  it("item do histórico não expõe id de gateway", () => {
    const item = paraItemHistoricoCobranca(
      cobranca({
        id: "cob-1",
        vencimento: "2026-07-15T12:00:00.000Z",
        linkPagamento: "https://pagar.exemplo/1",
      }),
    );
    expect(item).toEqual({
      id: "cob-1",
      valor: 59.9,
      metodo: "pix",
      status: "pendente",
      vencimento: new Date("2026-07-15T12:00:00.000Z"),
      pagaEm: null,
      linkPagamento: "https://pagar.exemplo/1",
    });
    expect(item).not.toHaveProperty("gatewayCobrancaId");
  });

  it("link de regularização vem da pendente ou vencida mais recente por vencimento", () => {
    const cobrancas = [
      cobranca({
        id: "paga-recente",
        vencimento: "2026-08-01T12:00:00.000Z",
        status: "paga",
        linkPagamento: "https://pagar.exemplo/paga",
      }),
      cobranca({
        id: "vencida-antiga",
        vencimento: "2026-06-01T12:00:00.000Z",
        status: "vencida",
        linkPagamento: "https://pagar.exemplo/vencida",
      }),
      cobranca({
        id: "pendente-meio",
        vencimento: "2026-07-01T12:00:00.000Z",
        status: "pendente",
        linkPagamento: "https://pagar.exemplo/pendente",
      }),
    ];

    expect(resolverLinkRegularizacao(cobrancas)).toBe(
      "https://pagar.exemplo/pendente",
    );
  });

  it("link de regularização é null quando não há cobrança pendente nem vencida", () => {
    const cobrancas = [
      cobranca({
        id: "paga",
        vencimento: "2026-08-01T12:00:00.000Z",
        status: "paga",
        linkPagamento: "https://pagar.exemplo/paga",
      }),
      cobranca({
        id: "estornada",
        vencimento: "2026-07-01T12:00:00.000Z",
        status: "estornada",
        linkPagamento: "https://pagar.exemplo/estorno",
      }),
    ];

    expect(resolverLinkRegularizacao(cobrancas)).toBeNull();
    expect(resolverLinkRegularizacao([])).toBeNull();
  });
});
