import { describe, expect, it } from "vitest";

import { PRECO_PROMOCIONAL_CENTAVOS } from "../../domain/constants";
import { VagaPromocional } from "../../domain/VagaPromocional";
import {
  CLINICA_ID,
  PLANO_ID,
  criarContextoAssinatura,
  seedTrialAtivo,
} from "./helpers-test";
import { ResolverValorCobrancaAssinatura } from "./ResolverValorCobrancaAssinatura";

const INICIO = new Date("2026-07-01T12:00:00.000Z");

describe("ResolverValorCobrancaAssinatura (spec 012)", () => {
  it("retorna valor promocional enquanto agora < precoPromocionalAte", async () => {
    const ctx = await criarContextoAssinatura();
    const trial = await seedTrialAtivo(ctx);
    const vaga = VagaPromocional.criar({
      posicao: 1,
      clinicaId: CLINICA_ID,
      assinaturaId: trial.id,
      reservadaEm: INICIO,
    });
    const comPromo = trial.aplicarCopiaPromocionalDaVaga({
      vaga,
      precoPromocionalCentavos: PRECO_PROMOCIONAL_CENTAVOS.basico,
    });
    await ctx.assinaturaRepo.salvar(comPromo);

    const resultado = await new ResolverValorCobrancaAssinatura(
      ctx.assinaturaRepo,
      ctx.planoRepo,
    ).executar({
      assinaturaId: trial.id,
      agora: INICIO,
    });

    expect(resultado).toEqual({
      valorCentavos: PRECO_PROMOCIONAL_CENTAVOS.basico,
      origem: "promocional",
    });
  });

  it("retorna preço cheio do plano após o fim da promoção", async () => {
    const ctx = await criarContextoAssinatura();
    const trial = await seedTrialAtivo(ctx);
    const vaga = VagaPromocional.criar({
      posicao: 1,
      clinicaId: CLINICA_ID,
      assinaturaId: trial.id,
      reservadaEm: INICIO,
    });
    const comPromo = trial
      .aplicarCopiaPromocionalDaVaga({
        vaga,
        precoPromocionalCentavos: PRECO_PROMOCIONAL_CENTAVOS.basico,
      })
      .vincularPlanoNoGateway({
        planoId: PLANO_ID,
        gatewayClienteId: "cli",
        gatewayAssinaturaId: "sub",
        dataProximaCobranca: INICIO,
      });
    await ctx.assinaturaRepo.salvar(comPromo);

    const resultado = await new ResolverValorCobrancaAssinatura(
      ctx.assinaturaRepo,
      ctx.planoRepo,
    ).executar({
      assinaturaId: trial.id,
      agora: vaga.calcularPrecoPromocionalAte(),
    });

    expect(resultado.origem).toBe("cheio");
    expect(resultado.valorCentavos).toBe(9990);
  });
});
