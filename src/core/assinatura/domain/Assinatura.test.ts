import { describe, expect, it } from "vitest";

import { DadosInvalidosError } from "@/core/shared/errors";

import {
  Assinatura,
  adicionarDiasCorridos,
} from "./Assinatura";
import { Cobranca } from "./Cobranca";
import {
  DURACAO_TRIAL_DIAS,
  TOLERANCIA_INADIMPLENCIA_DIAS,
} from "./constants";
import { TransicaoStatusAssinaturaInvalidaError } from "./errors";

const INICIO = new Date("2026-07-01T12:00:00.000Z");

function trial(dataInicio: Date = INICIO) {
  return Assinatura.iniciarTrial({
    id: "ass-1",
    clinicaId: "clinica-1",
    dataInicio,
  });
}

function ativa() {
  return trial().ativarAposPagamento({
    planoId: "plano-1",
    gatewayClienteId: "cli-1",
    gatewayAssinaturaId: "sub-1",
    dataProximaCobranca: new Date("2026-08-01T12:00:00.000Z"),
  });
}

describe("Assinatura (domínio — spec 010)", () => {
  describe("trial de 14 dias", () => {
    it("inicia em trialing com dataFimTrial = dataInicio + 14 dias corridos", () => {
      const assinatura = trial();

      expect(assinatura.status).toBe("trialing");
      expect(assinatura.planoId).toBeNull();
      expect(assinatura.gatewayAssinaturaId).toBeNull();
      expect(assinatura.dataFimTrial).toEqual(
        adicionarDiasCorridos(INICIO, DURACAO_TRIAL_DIAS),
      );
      expect(DURACAO_TRIAL_DIAS).toBe(14);
    });

    it("avaliarAcesso permite escrita durante o trial vigente", () => {
      const assinatura = trial();
      const durante = new Date("2026-07-10T12:00:00.000Z");

      expect(assinatura.avaliarAcesso(durante)).toEqual({
        permitido: true,
        motivo: "trialing",
        ateData: assinatura.dataFimTrial!,
      });
    });

    it("após 14 dias sem conversão, avaliarAcesso nega com sem_assinatura", () => {
      const assinatura = trial();
      const depois = adicionarDiasCorridos(INICIO, DURACAO_TRIAL_DIAS + 1);

      expect(assinatura.trialExpirado(depois)).toBe(true);
      expect(assinatura.avaliarAcesso(depois)).toEqual({
        permitido: false,
        motivo: "sem_assinatura",
      });
    });
  });

  describe("transições de status", () => {
    it("percorre trialing → ativa → inadimplente → ativa", () => {
      const a1 = trial();
      expect(a1.status).toBe("trialing");

      const a2 = a1.ativarAposPagamento({
        planoId: "plano-1",
        gatewayClienteId: "cli-1",
        gatewayAssinaturaId: "sub-1",
        dataProximaCobranca: new Date("2026-08-01T12:00:00.000Z"),
      });
      expect(a2.status).toBe("ativa");

      const a3 = a2.marcarInadimplente();
      expect(a3.status).toBe("inadimplente");
      expect(a3.avaliarAcesso()).toEqual({
        permitido: false,
        motivo: "inadimplente",
      });

      const a4 = a3.restaurarAposPagamento(
        new Date("2026-09-01T12:00:00.000Z"),
      );
      expect(a4.status).toBe("ativa");
      expect(a4.avaliarAcesso()).toEqual({
        permitido: true,
        motivo: "ativa",
      });
    });

    it("rejeita transição inválida (ex.: cancelada → ativa)", () => {
      const cancelada = ativa().cancelar();
      expect(() =>
        cancelada.ativarAposPagamento({
          planoId: "plano-1",
          gatewayClienteId: "cli-1",
          gatewayAssinaturaId: "sub-1",
          dataProximaCobranca: null,
        }),
      ).toThrow(TransicaoStatusAssinaturaInvalidaError);
    });
  });

  describe("tolerância de 3 dias após cobrança vencida", () => {
    it("dentro da tolerância não deve marcar inadimplente", () => {
      const assinatura = ativa();
      const vencidaEm = new Date("2026-07-10T12:00:00.000Z");
      const cobranca = Cobranca.criar({
        id: "cob-1",
        assinaturaId: assinatura.id,
        gatewayCobrancaId: "gw-pay-1",
        valor: 99.9,
        metodo: "pix",
        vencimento: vencidaEm,
      }).marcarVencida(vencidaEm);

      const noLimite = adicionarDiasCorridos(
        vencidaEm,
        TOLERANCIA_INADIMPLENCIA_DIAS,
      );
      expect(
        assinatura.deveMarcarInadimplentePorCobranca(cobranca, noLimite),
      ).toBe(false);
      expect(TOLERANCIA_INADIMPLENCIA_DIAS).toBe(3);
    });

    it("após 3 dias corridos com cobrança vencida, deve marcar inadimplente", () => {
      const assinatura = ativa();
      const vencidaEm = new Date("2026-07-10T12:00:00.000Z");
      const cobranca = Cobranca.criar({
        id: "cob-1",
        assinaturaId: assinatura.id,
        gatewayCobrancaId: "gw-pay-1",
        valor: 99.9,
        metodo: "boleto",
        vencimento: vencidaEm,
      }).marcarVencida(vencidaEm);

      const depois = adicionarDiasCorridos(
        vencidaEm,
        TOLERANCIA_INADIMPLENCIA_DIAS + 1,
      );
      expect(
        assinatura.deveMarcarInadimplentePorCobranca(cobranca, depois),
      ).toBe(true);
    });
  });

  describe("acessoManualAte (opção A)", () => {
    it("concede acesso sem alterar status real da assinatura", () => {
      const inadimplente = ativa().marcarInadimplente();
      const ate = new Date("2026-08-15T12:00:00.000Z");
      const comOverride = inadimplente.concederAcessoManual({
        motivo: "negociação comercial",
        ateData: ate,
      });

      expect(comOverride.status).toBe("inadimplente");
      expect(comOverride.acessoManualMotivo).toBe("negociação comercial");
      expect(comOverride.avaliarAcesso(new Date("2026-08-10T12:00:00.000Z"))).toEqual(
        {
          permitido: true,
          motivo: "acesso_manual",
          ateData: ate,
        },
      );
    });

    it("permite escrita com acessoManualAte vigente mesmo com cobrança vencida", () => {
      const assinatura = ativa()
        .marcarInadimplente()
        .concederAcessoManual({
          motivo: "cortesia",
          ateData: new Date("2026-08-20T12:00:00.000Z"),
        });

      const cobranca = Cobranca.criar({
        id: "cob-v",
        assinaturaId: assinatura.id,
        gatewayCobrancaId: "gw-pay-v",
        valor: 99.9,
        metodo: "pix",
        vencimento: new Date("2026-07-01T12:00:00.000Z"),
      }).marcarVencida(new Date("2026-07-01T12:00:00.000Z"));

      expect(cobranca.status).toBe("vencida");
      expect(
        assinatura.avaliarAcesso(new Date("2026-08-10T12:00:00.000Z")).permitido,
      ).toBe(true);
      expect(
        assinatura.avaliarAcesso(new Date("2026-08-10T12:00:00.000Z")).motivo,
      ).toBe("acesso_manual");
    });

    it("após expirar acessoManualAte, volta a negar se inadimplente", () => {
      const assinatura = ativa()
        .marcarInadimplente()
        .concederAcessoManual({
          motivo: "cortesia",
          ateData: new Date("2026-08-01T12:00:00.000Z"),
        });

      expect(
        assinatura.avaliarAcesso(new Date("2026-08-02T12:00:00.000Z")),
      ).toEqual({
        permitido: false,
        motivo: "inadimplente",
      });
    });

    it("rejeita concessão sem motivo", () => {
      expect(() =>
        ativa().concederAcessoManual({
          motivo: "   ",
          ateData: new Date("2026-08-01T12:00:00.000Z"),
        }),
      ).toThrow(DadosInvalidosError);
    });
  });
});
