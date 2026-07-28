import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import { CodigoOAuthInvalidoError } from "../../domain/errors";
import { ConcluirConexaoWhatsapp } from "./ConcluirConexaoWhatsapp";
import { seedSolicitanteWhatsapp } from "./helpers-test";

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
});
