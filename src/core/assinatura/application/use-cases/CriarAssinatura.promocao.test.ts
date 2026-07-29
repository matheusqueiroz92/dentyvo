import { describe, expect, it, vi } from "vitest";

import { PRECO_PROMOCIONAL_CENTAVOS } from "../../domain/constants";
import { CriarAssinatura } from "./CriarAssinatura";
import {
  CLINICA_ID,
  PLANO_FULL_ID,
  PLANO_ID,
  criarContextoAssinatura,
  esgotarVagasPromocionais,
  seedTrialAtivo,
} from "./helpers-test";
import { ReservarVagaPromocional } from "./ReservarVagaPromocional";

/**
 * Extensão promocional de `CriarAssinatura` (spec 012, E1/E2/E3).
 * Red até o Implementador orquestrar reserva + cópia no fluxo existente.
 */
describe("CriarAssinatura + promoção de lançamento (spec 012)", () => {
  function sut(ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>) {
    return new CriarAssinatura(
      ctx.assinaturaRepo,
      ctx.planoRepo,
      ctx.gateway,
      ctx.clinicaRepo,
      ctx.profissionalRepo,
      ctx.vagaRepo,
    );
  }

  it("E1: plano elegível com vaga aplica preço promocional na assinatura e no gateway", async () => {
    const ctx = await criarContextoAssinatura("admin");
    await seedTrialAtivo(ctx);
    const spy = vi.spyOn(ctx.vagaRepo, "reservarAtomico");

    const assinatura = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      planoId: PLANO_ID,
      metodoPagamento: "pix",
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    expect(spy).toHaveBeenCalled();
    expect(assinatura.precoPromocionalCentavos).toBe(
      PRECO_PROMOCIONAL_CENTAVOS.basico,
    );
    expect(assinatura.precoPromocionalAte).not.toBeNull();
    expect(await ctx.vagaRepo.contarReservadas()).toBe(1);
    expect(ctx.gateway.assinaturasCriadas[0]?.valorMensal).toBe(59);
  });

  it("E2: plano elegível sem vaga cria assinatura em preço cheio sem erro", async () => {
    const ctx = await criarContextoAssinatura("admin");
    await seedTrialAtivo(ctx);
    await esgotarVagasPromocionais(ctx);
    const spy = vi.spyOn(ctx.vagaRepo, "reservarAtomico");

    const assinatura = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      planoId: PLANO_ID,
      metodoPagamento: "pix",
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    // Deve tentar reservar (elegível) e degradar para preço cheio
    expect(spy).toHaveBeenCalled();
    expect(assinatura.precoPromocionalCentavos).toBeNull();
    expect(assinatura.precoPromocionalAte).toBeNull();
    expect(assinatura.planoId).toBe(PLANO_ID);
    expect(ctx.gateway.assinaturasCriadas[0]?.valorMensal).toBe(99.9);
    expect(await ctx.vagaRepo.contarReservadas()).toBe(30);
  });

  it("E3: plano Full nunca reserva vaga, mesmo com cupom livre", async () => {
    const ctx = await criarContextoAssinatura("admin");
    await seedTrialAtivo(ctx);

    // Gate de elegibilidade (ReservarVagaPromocional) — Full → null sem insert
    const gate = await new ReservarVagaPromocional(
      ctx.vagaRepo,
      ctx.planoRepo,
    ).executar({
      clinicaId: CLINICA_ID,
      assinaturaId: "assinatura-1",
      planoId: PLANO_FULL_ID,
      agora: new Date("2026-07-01T12:00:00.000Z"),
    });
    expect(gate).toBeNull();
    expect(ctx.vagaRepo.tentativasInsert).toBe(0);

    const spy = vi.spyOn(ctx.vagaRepo, "reservarAtomico");
    const assinatura = await sut(ctx).executar({
      clinicaId: CLINICA_ID,
      planoId: PLANO_FULL_ID,
      metodoPagamento: "pix",
      solicitadoPorUsuarioId: ctx.solicitadoPorUsuarioId,
    });

    expect(spy).not.toHaveBeenCalled();
    expect(assinatura.precoPromocionalCentavos).toBeNull();
    expect(await ctx.vagaRepo.contarReservadas()).toBe(0);
    expect(ctx.gateway.assinaturasCriadas[0]?.valorMensal).toBe(279);
  });
});
