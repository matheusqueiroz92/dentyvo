import { describe, expect, it } from "vitest";

import { STATUS_ASSINATURA } from "@/core/assinatura/domain/StatusAssinatura";
import { STATUS_COBRANCA } from "@/core/assinatura/domain/StatusCobranca";
import { METODOS_PAGAMENTO } from "@/core/assinatura/domain/MetodoPagamento";

import {
  rotuloMetodoPagamento,
  rotuloStatusAssinatura,
  rotuloStatusCobranca,
} from "./rotulos-assinatura";

describe("rótulos do painel de assinatura", () => {
  it("traduz status da assinatura sem expor o enum cru", () => {
    const esperados: Record<(typeof STATUS_ASSINATURA)[number], string> = {
      trialing: "Trial",
      ativa: "Ativa",
      inadimplente: "Inadimplente",
      cancelada: "Cancelada",
    };
    for (const status of STATUS_ASSINATURA) {
      expect(rotuloStatusAssinatura(status)).toBe(esperados[status]);
      expect(rotuloStatusAssinatura(status)).not.toBe(status);
    }
  });

  it("traduz status da cobrança sem expor o enum cru", () => {
    const esperados: Record<(typeof STATUS_COBRANCA)[number], string> = {
      pendente: "Pendente",
      paga: "Paga",
      vencida: "Vencida",
      estornada: "Estornada",
    };
    for (const status of STATUS_COBRANCA) {
      expect(rotuloStatusCobranca(status)).toBe(esperados[status]);
      expect(rotuloStatusCobranca(status)).not.toBe(status);
    }
  });

  it("traduz método de pagamento", () => {
    expect(rotuloMetodoPagamento("pix")).toBe("Pix");
    expect(rotuloMetodoPagamento("boleto")).toBe("Boleto");
    expect(rotuloMetodoPagamento("cartao")).toBe("Cartão");
    for (const metodo of METODOS_PAGAMENTO) {
      expect(rotuloMetodoPagamento(metodo)).not.toBe(metodo);
    }
  });
});
