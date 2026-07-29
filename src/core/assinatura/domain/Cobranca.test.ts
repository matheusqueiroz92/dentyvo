import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import { Cobranca } from "./Cobranca";
import { TransicaoStatusCobrancaInvalidaError } from "./errors";

function cobrancaPendente() {
  return Cobranca.criar({
    id: "cob-1",
    assinaturaId: "ass-1",
    gatewayCobrancaId: "gw-pay-1",
    valor: 99.9,
    metodo: "pix",
    vencimento: new Date("2026-07-15T12:00:00.000Z"),
  });
}

describe("Cobranca (domínio — spec 010)", () => {
  it("cria cobrança pendente com método genérico do domínio", () => {
    const cobranca = cobrancaPendente();

    expect(cobranca.status).toBe("pendente");
    expect(cobranca.metodo).toBe("pix");
    expect(cobranca.vencidaEm).toBeNull();
    expect(cobranca.pagaEm).toBeNull();
  });

  it("transiciona pendente → paga e registra pagaEm", () => {
    const pagaEm = new Date("2026-07-14T10:00:00.000Z");
    const cobranca = cobrancaPendente().marcarPaga(pagaEm);

    expect(cobranca.status).toBe("paga");
    expect(cobranca.pagaEm).toEqual(pagaEm);
  });

  it("transiciona pendente → vencida e registra vencidaEm (base da tolerância)", () => {
    const vencidaEm = new Date("2026-07-16T00:00:00.000Z");
    const cobranca = cobrancaPendente().marcarVencida(vencidaEm);

    expect(cobranca.status).toBe("vencida");
    expect(cobranca.vencidaEm).toEqual(vencidaEm);
  });

  it("permite vencida → paga (regularização) e paga → estornada", () => {
    const regularizada = cobrancaPendente()
      .marcarVencida(new Date("2026-07-16T00:00:00.000Z"))
      .marcarPaga(new Date("2026-07-18T00:00:00.000Z"));
    expect(regularizada.status).toBe("paga");
    expect(regularizada.vencidaEm).toBeNull();

    const estornada = regularizada.marcarEstornada();
    expect(estornada.status).toBe("estornada");
  });

  it("rejeita transição inválida (estornada → paga)", () => {
    const estornada = cobrancaPendente()
      .marcarPaga()
      .marcarEstornada();

    expect(() => estornada.marcarPaga()).toThrow(
      TransicaoStatusCobrancaInvalidaError,
    );
  });

  it("aceita metodo cartao no modelo, mas rejeita valor de método desconhecido", () => {
    const comCartao = Cobranca.criar({
      id: "cob-card",
      assinaturaId: "ass-1",
      gatewayCobrancaId: "gw-pay-card",
      valor: 10,
      metodo: "cartao",
      vencimento: new Date("2026-07-15T12:00:00.000Z"),
    });
    expect(comCartao.metodo).toBe("cartao");

    expect(() =>
      Cobranca.criar({
        id: "cob-x",
        assinaturaId: "ass-1",
        gatewayCobrancaId: "gw-x",
        valor: 10,
        metodo: "bitcoin",
        vencimento: new Date("2026-07-15T12:00:00.000Z"),
      }),
    ).toThrow(DadosInvalidosError);
  });
});
