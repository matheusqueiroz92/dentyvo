import { describe, expect, it } from "vitest";

import { PermissaoNegadaError, TenantMismatchError } from "@/core/shared/errors";

import { ConfiguracaoPopup } from "../../domain/ConfiguracaoPopup";
import { IniciarConexaoWhatsapp } from "./IniciarConexaoWhatsapp";
import { seedSolicitanteWhatsapp } from "./helpers-test";

const CONFIG = {
  appId: "meta-app-id",
  configurationId: "meta-config-id",
};

describe("IniciarConexaoWhatsapp", () => {
  it("admin inicia conexão, deixa conta pendente e recebe ConfiguracaoPopup", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const sut = new IniciarConexaoWhatsapp(
      ctx.contaRepo,
      ctx.profissionalRepo,
      CONFIG,
    );

    const popup = await sut.executar({
      clinicaId: ctx.clinicaId,
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    expect(popup).toBeInstanceOf(ConfiguracaoPopup);
    expect(popup.appId).toBe(CONFIG.appId);
    expect(popup.configurationId).toBe(CONFIG.configurationId);

    const conta = await ctx.contaRepo.buscarPorClinicaId(ctx.clinicaId);
    expect(conta).not.toBeNull();
    expect(conta!.status).toBe("pendente");
  });

  it.each(["dentista", "recepcao"] as const)(
    "%s não pode iniciar conexão WhatsApp",
    async (papel) => {
      const ctx = await seedSolicitanteWhatsapp(papel);
      const sut = new IniciarConexaoWhatsapp(
        ctx.contaRepo,
        ctx.profissionalRepo,
        CONFIG,
      );

      await expect(
        sut.executar({
          clinicaId: ctx.clinicaId,
          solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);

      expect(await ctx.contaRepo.buscarPorClinicaId(ctx.clinicaId)).toBeNull();
    },
  );

  it("não inicia conexão em clínica diferente da do solicitante", async () => {
    const ctx = await seedSolicitanteWhatsapp("admin");
    const sut = new IniciarConexaoWhatsapp(
      ctx.contaRepo,
      ctx.profissionalRepo,
      CONFIG,
    );

    await expect(
      sut.executar({
        clinicaId: "outra-clinica",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      }),
    ).rejects.toBeInstanceOf(TenantMismatchError);
  });
});
