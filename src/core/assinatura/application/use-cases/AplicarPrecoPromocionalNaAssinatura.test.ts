import { describe, expect, it } from "vitest";

import { PRECO_PROMOCIONAL_CENTAVOS } from "../../domain/constants";
import { VagaPromocional } from "../../domain/VagaPromocional";
import { AplicarPrecoPromocionalNaAssinatura } from "./AplicarPrecoPromocionalNaAssinatura";
import {
  CLINICA_ID,
  PLANO_ID,
  criarContextoAssinatura,
  seedTrialAtivo,
} from "./helpers-test";

const AGORA = new Date("2026-07-01T12:00:00.000Z");

describe("AplicarPrecoPromocionalNaAssinatura (spec 012, D6)", () => {
  it("copia precoPromocionalCentavos e precoPromocionalAte a partir da VagaPromocional", async () => {
    const ctx = await criarContextoAssinatura();
    const trial = await seedTrialAtivo(ctx);
    const vaga = VagaPromocional.criar({
      posicao: 1,
      clinicaId: CLINICA_ID,
      assinaturaId: trial.id,
      reservadaEm: AGORA,
    });

    const atualizada = await new AplicarPrecoPromocionalNaAssinatura(
      ctx.assinaturaRepo,
      ctx.planoRepo,
    ).executar({
      assinaturaId: trial.id,
      vaga,
      planoId: PLANO_ID,
    });

    expect(atualizada.precoPromocionalCentavos).toBe(
      PRECO_PROMOCIONAL_CENTAVOS.basico,
    );
    expect(atualizada.precoPromocionalAte).toEqual(
      vaga.calcularPrecoPromocionalAte(),
    );
    const persistida = await ctx.assinaturaRepo.buscarPorId(trial.id);
    expect(persistida?.precoPromocionalCentavos).toBe(
      PRECO_PROMOCIONAL_CENTAVOS.basico,
    );
  });
});
