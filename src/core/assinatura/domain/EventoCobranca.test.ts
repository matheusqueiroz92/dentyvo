import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import { EventoCobranca } from "./EventoCobranca";

describe("EventoCobranca (domínio genérico — spec 010)", () => {
  it("cria evento com status/método do domínio e eventoId opaco para idempotência", () => {
    const evento = EventoCobranca.criar({
      eventoId: "evt_generico_001",
      gatewayCobrancaId: "gw-pay-1",
      gatewayAssinaturaId: "gw-sub-1",
      status: "paga",
      valor: 99.9,
      metodo: "pix",
      vencimento: new Date("2026-07-15T12:00:00.000Z"),
      pagaEm: new Date("2026-07-14T12:00:00.000Z"),
    });

    expect(evento.eventoId).toBe("evt_generico_001");
    expect(evento.status).toBe("paga");
    expect(evento.metodo).toBe("pix");
  });

  it("aceita status vencida e estornada no vocabulário do domínio", () => {
    const vencida = EventoCobranca.criar({
      eventoId: "evt_2",
      gatewayCobrancaId: "gw-pay-2",
      status: "vencida",
      valor: 99.9,
      metodo: "boleto",
      vencimento: new Date("2026-07-15T12:00:00.000Z"),
    });
    expect(vencida.status).toBe("vencida");

    const estornada = EventoCobranca.criar({
      eventoId: "evt_3",
      gatewayCobrancaId: "gw-pay-3",
      status: "estornada",
      valor: 99.9,
      metodo: "pix",
      vencimento: new Date("2026-07-15T12:00:00.000Z"),
    });
    expect(estornada.status).toBe("estornada");
  });

  it("rejeita eventoId vazio ou status fora do domínio", () => {
    expect(() =>
      EventoCobranca.criar({
        eventoId: "  ",
        gatewayCobrancaId: "gw-pay-1",
        status: "paga",
        valor: 10,
        metodo: "pix",
        vencimento: new Date("2026-07-15T12:00:00.000Z"),
      }),
    ).toThrow(DadosInvalidosError);

    expect(() =>
      EventoCobranca.criar({
        eventoId: "evt_x",
        gatewayCobrancaId: "gw-pay-1",
        status: "CONFIRMED",
        valor: 10,
        metodo: "pix",
        vencimento: new Date("2026-07-15T12:00:00.000Z"),
      }),
    ).toThrow(DadosInvalidosError);
  });
});
