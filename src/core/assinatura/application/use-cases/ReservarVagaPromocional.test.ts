import { describe, expect, it } from "vitest";

import {
  CLINICA_ID,
  PLANO_FULL_ID,
  PLANO_ID,
  criarContextoAssinatura,
  esgotarVagasPromocionais,
  seedTrialAtivo,
} from "./helpers-test";
import { ReservarVagaPromocional } from "./ReservarVagaPromocional";

function sut(ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>) {
  return new ReservarVagaPromocional(ctx.vagaRepo, ctx.planoRepo);
}

describe("ReservarVagaPromocional (spec 012)", () => {
  it("E1: plano elegível com vaga disponível reserva VagaPromocional", async () => {
    const ctx = await criarContextoAssinatura();
    await seedTrialAtivo(ctx);

    const vaga = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      assinaturaId: "assinatura-1",
      planoId: PLANO_ID,
      agora: new Date("2026-07-01T12:00:00.000Z"),
    });

    expect(vaga).not.toBeNull();
    expect(vaga!.clinicaId).toBe(CLINICA_ID);
    expect(vaga!.assinaturaId).toBe("assinatura-1");
    expect(vaga!.posicao).toBeGreaterThanOrEqual(1);
    expect(vaga!.posicao).toBeLessThanOrEqual(30);
    expect(await ctx.vagaRepo.contarReservadas()).toBe(1);
  });

  it("E2: plano elegível sem vaga disponível retorna null (sem erro para o admin)", async () => {
    const ctx = await criarContextoAssinatura();
    await seedTrialAtivo(ctx);
    await esgotarVagasPromocionais(ctx);

    const vaga = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      assinaturaId: "assinatura-1",
      planoId: PLANO_ID,
      agora: new Date("2026-07-02T12:00:00.000Z"),
    });

    expect(vaga).toBeNull();
    expect(await ctx.vagaRepo.contarReservadas()).toBe(30);
  });

  it("E3: plano Full nunca chama reservarAtomico, mesmo com vaga livre", async () => {
    const ctx = await criarContextoAssinatura();
    await seedTrialAtivo(ctx);
    const tentativasAntes = ctx.vagaRepo.tentativasInsert;

    const vaga = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      assinaturaId: "assinatura-1",
      planoId: PLANO_FULL_ID,
      agora: new Date("2026-07-01T12:00:00.000Z"),
    });

    expect(vaga).toBeNull();
    expect(ctx.vagaRepo.tentativasInsert).toBe(tentativasAntes);
    expect(await ctx.vagaRepo.contarReservadas()).toBe(0);
  });
});
