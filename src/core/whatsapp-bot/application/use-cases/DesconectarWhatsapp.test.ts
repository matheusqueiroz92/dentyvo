import { describe, expect, it } from "vitest";

import { DadosInvalidosError, PermissaoNegadaError } from "@/core/shared/errors";

import { ClinicWhatsappAccount } from "../../domain/ClinicWhatsappAccount";
import { ContaWhatsappNaoEncontradaError } from "../../domain/errors";
import { DesconectarWhatsapp } from "./DesconectarWhatsapp";
import { seedSolicitanteWhatsapp } from "./helpers-test";

const tokenExpiraEm = new Date("2030-06-01T00:00:00.000Z");

async function seedContaConectada(
  ctx: Awaited<ReturnType<typeof seedSolicitanteWhatsapp>>,
) {
  const conectada = ClinicWhatsappAccount.criarPendente({
    id: "conta-1",
    clinicaId: ctx.clinicaId,
  }).concluirConexao({
    wabaId: "waba-1",
    phoneNumberId: "phone-1",
    accessTokenCriptografado: "enc:token",
    tokenExpiraEm,
  });
  await ctx.contaRepo.salvar(conectada);
  return conectada;
}

describe("DesconectarWhatsapp", () => {
  it("admin desconecta conta conectada e limpa token", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    await seedContaConectada(ctx);
    const sut = new DesconectarWhatsapp(ctx.contaRepo, ctx.profissionalRepo);

    await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    const conta = await ctx.contaRepo.buscarPorClinicaId(ctx.clinicaId);
    expect(conta!.status).toBe("desconectado");
    expect(conta!.accessTokenCriptografado).toBeNull();
    expect(conta!.podeEnviarMensagens()).toBe(false);
  });

  it("rejeita desconectar conta já desconectada (transição inválida)", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const desconectada = (await seedContaConectada(ctx)).desconectar();
    await ctx.contaRepo.salvar(desconectada);
    const sut = new DesconectarWhatsapp(ctx.contaRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      }),
    ).rejects.toBeInstanceOf(DadosInvalidosError);

    const conta = await ctx.contaRepo.buscarPorClinicaId(ctx.clinicaId);
    expect(conta!.status).toBe("desconectado");
  });

  it("falha quando a clínica não tem conta WhatsApp", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const sut = new DesconectarWhatsapp(ctx.contaRepo, ctx.profissionalRepo);

    await expect(
      sut.executar({
        clinicaId: ctx.clinicaId,
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      }),
    ).rejects.toBeInstanceOf(ContaWhatsappNaoEncontradaError);
  });

  it.each(["dentista", "recepcao"] as const)(
    "%s não pode desconectar WhatsApp",
    async (papel) => {
      const ctx = await seedSolicitanteWhatsapp(papel);
      await seedContaConectada(ctx);
      const sut = new DesconectarWhatsapp(ctx.contaRepo, ctx.profissionalRepo);

      await expect(
        sut.executar({
          clinicaId: ctx.clinicaId,
          solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);

      const conta = await ctx.contaRepo.buscarPorClinicaId(ctx.clinicaId);
      expect(conta!.status).toBe("conectado");
    },
  );
});
