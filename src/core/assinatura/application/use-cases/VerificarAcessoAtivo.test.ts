import { describe, expect, it } from "vitest";

import { adicionarDiasCorridos } from "../../domain/Assinatura";
import { DURACAO_TRIAL_DIAS } from "../../domain/constants";
import {
  CLINICA_ID,
  criarContextoAssinatura,
  seedTrialAtivo,
} from "./helpers-test";
import { VerificarAcessoAtivo } from "./VerificarAcessoAtivo";

function sut(ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>) {
  return new VerificarAcessoAtivo(ctx.assinaturaRepo);
}

describe("VerificarAcessoAtivo", () => {
  it("retorna permitido=true com motivo trialing durante o trial", async () => {
    const ctx = await criarContextoAssinatura();
    const inicio = new Date("2026-07-01T12:00:00.000Z");
    await seedTrialAtivo(ctx, inicio);

    const resultado = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      agora: new Date("2026-07-08T12:00:00.000Z"),
    });

    expect(resultado.permitido).toBe(true);
    expect(resultado.motivo).toBe("trialing");
    expect(resultado.ateData).toEqual(
      adicionarDiasCorridos(inicio, DURACAO_TRIAL_DIAS),
    );
  });

  it("retorna permitido=true com motivo acesso_manual mesmo com assinatura inadimplente", async () => {
    const ctx = await criarContextoAssinatura();
    const trial = await seedTrialAtivo(ctx);
    const comOverride = trial
      .ativarAposPagamento({
        planoId: "plano-basico",
        gatewayClienteId: "gw-cli-1",
        gatewayAssinaturaId: "gw-sub-1",
        dataProximaCobranca: new Date("2026-08-01T12:00:00.000Z"),
      })
      .marcarInadimplente()
      .concederAcessoManual({
        motivo: "cortesia",
        ateData: new Date("2026-08-20T12:00:00.000Z"),
      });
    await ctx.assinaturaRepo.salvar(comOverride);

    const resultado = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      agora: new Date("2026-08-10T12:00:00.000Z"),
    });

    expect(resultado).toEqual({
      permitido: true,
      motivo: "acesso_manual",
      ateData: new Date("2026-08-20T12:00:00.000Z"),
    });
  });

  it("retorna permitido=false para inadimplente sem override", async () => {
    const ctx = await criarContextoAssinatura();
    const trial = await seedTrialAtivo(ctx);
    await ctx.assinaturaRepo.salvar(
      trial
        .ativarAposPagamento({
          planoId: "plano-basico",
          gatewayClienteId: "gw-cli-1",
          gatewayAssinaturaId: "gw-sub-1",
          dataProximaCobranca: new Date("2026-08-01T12:00:00.000Z"),
        })
        .marcarInadimplente(),
    );

    const resultado = await sut(ctx).executar({ clinicaId: CLINICA_ID });

    expect(resultado).toEqual({
      permitido: false,
      motivo: "inadimplente",
    });
  });

  it("retorna permitido=false com motivo sem_assinatura quando não há registro", async () => {
    const ctx = await criarContextoAssinatura();

    const resultado = await sut(ctx).executar({ clinicaId: CLINICA_ID });

    expect(resultado).toEqual({
      permitido: false,
      motivo: "sem_assinatura",
    });
  });
});
