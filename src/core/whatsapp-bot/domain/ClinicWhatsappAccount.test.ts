import { describe, expect, it } from "vitest";

import { DadosInvalidosError, TenantMismatchError } from "@/core/shared/errors";

import { ClinicWhatsappAccount } from "./ClinicWhatsappAccount";
import { ANTECEDENCIA_RENOVACAO_TOKEN_MS } from "./constants";
import {
  TokenWhatsappInvalidoError,
  WhatsappNaoConectadoError,
} from "./errors";

const tokenExpiraEm = new Date("2030-06-01T00:00:00.000Z");
const conectadoEm = new Date("2026-01-15T12:00:00.000Z");

function criarPendente(
  overrides: Partial<Parameters<typeof ClinicWhatsappAccount.criarPendente>[0]> = {},
) {
  return ClinicWhatsappAccount.criarPendente({
    id: "conta-1",
    clinicaId: "clinica-1",
    ...overrides,
  });
}

function concluir(conta: ClinicWhatsappAccount = criarPendente()) {
  return conta.concluirConexao({
    wabaId: "waba-1",
    phoneNumberId: "phone-1",
    accessTokenCriptografado: "enc:token-meta",
    tokenExpiraEm,
    conectadoEm,
  });
}

describe("ClinicWhatsappAccount", () => {
  describe("estados pendente / conectado / desconectado", () => {
    it("cria conta em status pendente sem ids Meta nem token", () => {
      const conta = criarPendente();

      expect(conta.status).toBe("pendente");
      expect(conta.wabaId).toBeNull();
      expect(conta.phoneNumberId).toBeNull();
      expect(conta.accessTokenCriptografado).toBeNull();
      expect(conta.conectadoEm).toBeNull();
      expect(conta.tokenExpiraEm).toBeNull();
      expect(conta.podeEnviarMensagens()).toBe(false);
    });

    it("conclui conexão e passa para conectado com token criptografado e tokenExpiraEm", () => {
      const conta = concluir();

      expect(conta.status).toBe("conectado");
      expect(conta.wabaId).toBe("waba-1");
      expect(conta.phoneNumberId).toBe("phone-1");
      expect(conta.accessTokenCriptografado).toBe("enc:token-meta");
      expect(conta.tokenExpiraEm).toEqual(tokenExpiraEm);
      expect(conta.conectadoEm).toEqual(conectadoEm);
      expect(conta.podeEnviarMensagens()).toBe(true);
    });

    it("desconecta conta conectada, limpa token e bloqueia envio", () => {
      const conta = concluir().desconectar();

      expect(conta.status).toBe("desconectado");
      expect(conta.accessTokenCriptografado).toBeNull();
      expect(conta.tokenExpiraEm).toBeNull();
      expect(conta.podeEnviarMensagens()).toBe(false);
    });

    it("marcarPendente após falha no fluxo deixa status pendente sem quebrar invariantes", () => {
      const conta = concluir().marcarPendente();

      expect(conta.status).toBe("pendente");
      expect(conta.podeEnviarMensagens()).toBe(false);
    });

    it("token expirado ou revogado força status desconectado e limpa token", () => {
      const conta = concluir().invalidarPorTokenExpiradoOuRevogado();

      expect(conta.status).toBe("desconectado");
      expect(conta.accessTokenCriptografado).toBeNull();
      expect(conta.podeEnviarMensagens()).toBe(false);
    });
  });

  describe("invariantes de conclusão de conexão", () => {
    it("rejeita conclusão sem wabaId", () => {
      expect(() =>
        criarPendente().concluirConexao({
          wabaId: "  ",
          phoneNumberId: "phone-1",
          accessTokenCriptografado: "enc:tok",
          tokenExpiraEm,
        }),
      ).toThrow(DadosInvalidosError);
    });

    it("rejeita conclusão sem phoneNumberId", () => {
      expect(() =>
        criarPendente().concluirConexao({
          wabaId: "waba-1",
          phoneNumberId: "",
          accessTokenCriptografado: "enc:tok",
          tokenExpiraEm,
        }),
      ).toThrow(DadosInvalidosError);
    });

    it("rejeita conclusão sem token criptografado (conectado exige token válido)", () => {
      expect(() =>
        criarPendente().concluirConexao({
          wabaId: "waba-1",
          phoneNumberId: "phone-1",
          accessTokenCriptografado: "   ",
          tokenExpiraEm,
        }),
      ).toThrow(DadosInvalidosError);
    });

    it("rejeita conclusão com tokenExpiraEm inválida", () => {
      expect(() =>
        criarPendente().concluirConexao({
          wabaId: "waba-1",
          phoneNumberId: "phone-1",
          accessTokenCriptografado: "enc:tok",
          tokenExpiraEm: new Date("invalid"),
        }),
      ).toThrow(DadosInvalidosError);
    });
  });

  describe("transições de estado inválidas", () => {
    it("não permite desconectar uma conta já desconectada", () => {
      const conta = concluir().desconectar();

      expect(() => conta.desconectar()).toThrow(DadosInvalidosError);
    });

    it("não permite renovar token de conta que não está conectada", () => {
      const pendente = criarPendente();
      const desconectada = concluir().desconectar();

      expect(() =>
        pendente.renovarToken({
          accessTokenCriptografado: "enc:novo",
          tokenExpiraEm,
        }),
      ).toThrow(TokenWhatsappInvalidoError);

      expect(() =>
        desconectada.renovarToken({
          accessTokenCriptografado: "enc:novo",
          tokenExpiraEm,
        }),
      ).toThrow(TokenWhatsappInvalidoError);
    });
  });

  describe("podeEnviarMensagens / precisaRenovarToken", () => {
    it("só permite envio quando status é conectado e há token em repouso", () => {
      expect(criarPendente().podeEnviarMensagens()).toBe(false);
      expect(concluir().podeEnviarMensagens()).toBe(true);
      expect(concluir().desconectar().podeEnviarMensagens()).toBe(false);

      const conectadoSemToken = ClinicWhatsappAccount.reconstituir({
        id: "conta-2",
        clinicaId: "clinica-1",
        wabaId: "waba-1",
        phoneNumberId: "phone-1",
        accessTokenCriptografado: null,
        status: "conectado",
        conectadoEm,
        tokenExpiraEm,
      });
      expect(conectadoSemToken.podeEnviarMensagens()).toBe(false);
      expect(() => conectadoSemToken.assertPodeEnviarMensagens()).toThrow(
        WhatsappNaoConectadoError,
      );
    });

    it("precisaRenovarToken é true quando a expiração entra na janela de antecedência", () => {
      const conta = concluir();
      const agora = new Date(
        tokenExpiraEm.getTime() - ANTECEDENCIA_RENOVACAO_TOKEN_MS + 1,
      );

      expect(conta.precisaRenovarToken(agora, ANTECEDENCIA_RENOVACAO_TOKEN_MS)).toBe(
        true,
      );
    });

    it("precisaRenovarToken é false quando ainda há folga antes da antecedência", () => {
      const conta = concluir();
      const agora = new Date(
        tokenExpiraEm.getTime() - ANTECEDENCIA_RENOVACAO_TOKEN_MS - 60_000,
      );

      expect(conta.precisaRenovarToken(agora, ANTECEDENCIA_RENOVACAO_TOKEN_MS)).toBe(
        false,
      );
    });

    it("precisaRenovarToken é false para contas não conectadas ou sem tokenExpiraEm", () => {
      expect(
        criarPendente().precisaRenovarToken(
          new Date(),
          ANTECEDENCIA_RENOVACAO_TOKEN_MS,
        ),
      ).toBe(false);

      const semExpiracao = ClinicWhatsappAccount.reconstituir({
        id: "conta-3",
        clinicaId: "clinica-1",
        wabaId: "waba-1",
        phoneNumberId: "phone-1",
        accessTokenCriptografado: "enc:tok",
        status: "conectado",
        conectadoEm,
        tokenExpiraEm: null,
      });
      expect(
        semExpiracao.precisaRenovarToken(
          new Date(),
          ANTECEDENCIA_RENOVACAO_TOKEN_MS,
        ),
      ).toBe(false);
    });
  });

  it("assertPertenceAClinica falha quando o tenant não bate", () => {
    expect(() => criarPendente().assertPertenceAClinica("outra")).toThrow(
      TenantMismatchError,
    );
  });

  it("rejeita criar pendente sem id ou clinicaId", () => {
    expect(() =>
      ClinicWhatsappAccount.criarPendente({ id: " ", clinicaId: "c1" }),
    ).toThrow(DadosInvalidosError);
    expect(() =>
      ClinicWhatsappAccount.criarPendente({ id: "c1", clinicaId: "" }),
    ).toThrow(DadosInvalidosError);
  });
});
