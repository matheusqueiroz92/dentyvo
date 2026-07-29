import { describe, expect, it } from "vitest";

import { PermissaoNegadaError } from "@/core/shared/errors";

import { MetodoPagamentoNaoSuportadoError } from "../../domain/errors";
import {
  CLINICA_ID,
  PLANO_ID,
  criarContextoAssinatura,
  seedTrialAtivo,
} from "./helpers-test";
import { CriarAssinatura } from "./CriarAssinatura";

function sut(ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>) {
  return new CriarAssinatura(
    ctx.assinaturaRepo,
    ctx.planoRepo,
    ctx.gateway,
    ctx.clinicaRepo,
    ctx.profissionalRepo,
  );
}

describe("CriarAssinatura", () => {
  it("admin cria assinatura mensal via PIX e vincula ids opacos do gateway", async () => {
    const ctx = await criarContextoAssinatura("admin");
    await seedTrialAtivo(ctx);

    const assinatura = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      planoId: PLANO_ID,
      metodoPagamento: "pix",
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    expect(assinatura.planoId).toBe(PLANO_ID);
    expect(assinatura.gatewayClienteId).toBe("gw-cli-1");
    expect(assinatura.gatewayAssinaturaId).toBe("gw-sub-1");
    expect(ctx.gateway.clientesCriados).toHaveLength(1);
    expect(ctx.gateway.clientesCriados[0]?.referenciaExterna).toBe(CLINICA_ID);
    expect(ctx.gateway.assinaturasCriadas).toHaveLength(1);
    expect(ctx.gateway.assinaturasCriadas[0]?.metodo).toBe("pix");
    expect(ctx.gateway.assinaturasCriadas[0]?.valorMensal).toBe(99.9);
  });

  it("admin pode criar assinatura com boleto", async () => {
    const ctx = await criarContextoAssinatura("admin");
    await seedTrialAtivo(ctx);

    await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      planoId: PLANO_ID,
      metodoPagamento: "boleto",
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    expect(ctx.gateway.assinaturasCriadas[0]?.metodo).toBe("boleto");
  });

  it.each(["dentista", "recepcao"] as const)(
    "%s da clínica não pode criar assinatura (RBAC)",
    async (papel) => {
      const ctx = await criarContextoAssinatura(papel);
      await seedTrialAtivo(ctx);

      await expect(
        sut(ctx).executar({
          clinicaId: CLINICA_ID,
          planoId: PLANO_ID,
          metodoPagamento: "pix",
          solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
        }),
      ).rejects.toBeInstanceOf(PermissaoNegadaError);

      expect(ctx.gateway.assinaturasCriadas).toHaveLength(0);
    },
  );

  it("rejeita cartão no MVP (fora de escopo)", async () => {
    const ctx = await criarContextoAssinatura("admin");
    await seedTrialAtivo(ctx);

    await expect(
      sut(ctx).executar({
        clinicaId: CLINICA_ID,
        planoId: PLANO_ID,
        metodoPagamento: "cartao",
        solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
      }),
    ).rejects.toBeInstanceOf(MetodoPagamentoNaoSuportadoError);

    expect(ctx.gateway.assinaturasCriadas).toHaveLength(0);
  });
});
