import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import {
  CodigoOAuthInvalidoError,
  MultiplosNumerosNoWabaNaoSuportadoError,
} from "../../domain/errors";
import { ConcluirConexaoWhatsapp } from "./ConcluirConexaoWhatsapp";
import { seedSolicitanteWhatsapp } from "./helpers-test";

function contaConectada(clinicaId: string) {
  return ClinicWhatsappAccount.criarPendente({
    id: "conta-1",
    clinicaId,
  }).concluirConexao({
    wabaId: "waba-antigo",
    phoneNumberId: "phone-antigo",
    accessTokenCriptografado: "enc:token-antigo",
    tokenExpiraEm: new Date("2030-01-01T00:00:00.000Z"),
    conectadoEm: new Date("2026-01-01T00:00:00.000Z"),
  });
}

describe("ConcluirConexaoWhatsapp", () => {
  it("admin conclui OAuth, persiste conta conectada com token criptografado e inscreve webhook", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const meta = ctx.criarMeta();
    const sut = new ConcluirConexaoWhatsapp(
      ctx.contaRepo,
      meta,
      ctx.criptografia,
      ctx.profissionalRepo,
    );

    const conta = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      codigoOAuth: "codigo-valido",
    });

    expect(conta.status).toBe("conectado");
    expect(conta.wabaId).toBe("waba-1");
    expect(conta.phoneNumberId).toBe("phone-1");
    expect(conta.accessTokenCriptografado).toBe("enc:token-longo-meta");
    expect(conta.accessTokenCriptografado).not.toBe("token-longo-meta");
    expect(conta.accessTokenCriptografado?.startsWith("enc:")).toBe(true);
    expect(meta.webhooks).toHaveLength(1);
    expect(meta.webhooks[0]?.phoneNumberId).toBe("phone-1");
  });

  it("código OAuth inválido não deixa a conta conectada e retorna erro tratável", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    await ctx.contaRepo.salvar(
      ClinicWhatsappAccount.criarPendente({
        id: "conta-1",
        clinicaId: ctx.clinicaId,
      }),
    );
    const meta = ctx.criarMeta({ falharTroca: true });
    const sut = new ConcluirConexaoWhatsapp(
      ctx.contaRepo,
      meta,
      ctx.criptografia,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        codigoOAuth: "codigo-invalido",
      }),
    ).rejects.toBeInstanceOf(CodigoOAuthInvalidoError);

    const conta = await ctx.contaRepo.buscarPorClinicaId(ctx.clinicaId);
    expect(conta).not.toBeNull();
    expect(conta!.status).toBe("pendente");
    expect(conta!.podeEnviarMensagens()).toBe(false);
    expect(meta.webhooks).toHaveLength(0);
  });

  it.each(["dentista", "recepcao"] as const)(
    "%s não pode concluir conexão WhatsApp",
    async (papel) => {
      const ctx = await seedSolicitanteWhatsapp(papel);
      const meta = ctx.criarMeta();
      const sut = new ConcluirConexaoWhatsapp(
        ctx.contaRepo,
        meta,
        ctx.criptografia,
        ctx.profissionalRepo,
      );

      await expect(
        sut.executar({
          clinicaId: ctx.clinicaId,
          solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
          codigoOAuth: "codigo-valido",
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);

      expect(meta.trocas).toHaveLength(0);
    },
  );

  it("WABA com múltiplos números não deixa a conta conectada e propaga o erro de domínio", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const meta = ctx.criarMeta();
    meta.trocarCodigoPorToken = async (codigo) => {
      meta.trocas.push(codigo);
      throw new MultiplosNumerosNoWabaNaoSuportadoError("waba-1", 2);
    };
    const sut = new ConcluirConexaoWhatsapp(
      ctx.contaRepo,
      meta,
      ctx.criptografia,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        codigoOAuth: "codigo-valido",
      }),
    ).rejects.toBeInstanceOf(MultiplosNumerosNoWabaNaoSuportadoError);

    const conta = await ctx.contaRepo.buscarPorClinicaId(ctx.clinicaId);
    expect(conta?.status).not.toBe("conectado");
    expect(conta?.podeEnviarMensagens()).toBe(false);
    expect(meta.webhooks).toHaveLength(0);
  });

  it("falha na inscrição do webhook não marca conta nova como conectada", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const meta = ctx.criarMeta({ falharWebhook: true });
    const sut = new ConcluirConexaoWhatsapp(
      ctx.contaRepo,
      meta,
      ctx.criptografia,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        codigoOAuth: "codigo-valido",
      }),
    ).rejects.toThrow();

    const conta = await ctx.contaRepo.buscarPorClinicaId(ctx.clinicaId);
    expect(conta?.status).not.toBe("conectado");
    expect(conta?.podeEnviarMensagens()).toBe(false);
  });

  it("falha na inscrição do webhook preserva a conexão anterior numa reconexão", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    await ctx.contaRepo.salvar(contaConectada(ctx.clinicaId));
    const meta = ctx.criarMeta({ falharWebhook: true });
    const sut = new ConcluirConexaoWhatsapp(
      ctx.contaRepo,
      meta,
      ctx.criptografia,
      ctx.profissionalRepo,
    );

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        codigoOAuth: "codigo-valido",
      }),
    ).rejects.toThrow();

    const conta = await ctx.contaRepo.buscarPorClinicaId(ctx.clinicaId);
    expect(conta?.status).toBe("conectado");
    expect(conta?.phoneNumberId).toBe("phone-antigo");
    expect(conta?.accessTokenCriptografado).toBe("enc:token-antigo");
    expect(conta?.wabaId).toBe("waba-antigo");
  });

  it("inscreve o webhook antes de persistir o status conectado", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const meta = ctx.criarMeta();
    const ordem: string[] = [];
    const salvarOriginal = ctx.contaRepo.salvar.bind(ctx.contaRepo);
    ctx.contaRepo.salvar = async (conta) => {
      ordem.push(`salvar:${conta.status}`);
      await salvarOriginal(conta);
    };
    const webhookOriginal = meta.inscreverWebhook.bind(meta);
    meta.inscreverWebhook = async (input) => {
      ordem.push("webhook");
      await webhookOriginal(input);
    };

    const sut = new ConcluirConexaoWhatsapp(
      ctx.contaRepo,
      meta,
      ctx.criptografia,
      ctx.profissionalRepo,
    );
    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      codigoOAuth: "codigo-valido",
    });

    expect(ordem.indexOf("webhook")).toBeGreaterThan(-1);
    expect(ordem.indexOf("salvar:conectado")).toBeGreaterThan(
      ordem.indexOf("webhook"),
    );
  });
});
