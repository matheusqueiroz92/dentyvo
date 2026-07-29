import { describe, expect, it } from "vitest";

import { PRECO_PROMOCIONAL_CENTAVOS } from "../../domain/constants";
import { VagaPromocional } from "../../domain/VagaPromocional";
import {
  CLINICA_ID,
  PLANO_ID,
  criarContextoAssinatura,
  seedTrialAtivo,
} from "./helpers-test";
import { MigrarPrecoPosPromocao } from "./MigrarPrecoPosPromocao";

const INICIO = new Date("2026-07-01T12:00:00.000Z");

async function seedAssinaturaPromocionalPaga(
  ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>,
) {
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
      gatewayClienteId: "gw-cli-1",
      gatewayAssinaturaId: "gw-sub-1",
      dataProximaCobranca: INICIO,
    });
  await ctx.assinaturaRepo.salvar(comPromo);
  return { assinatura: comPromo, vaga };
}

describe("MigrarPrecoPosPromocao (spec 012)", () => {
  it("após precoPromocionalAte, atualiza gateway para preço cheio e marca migradaParaPrecoCheioEm", async () => {
    const ctx = await criarContextoAssinatura();
    const { assinatura, vaga } = await seedAssinaturaPromocionalPaga(ctx);
    const agora = vaga.calcularPrecoPromocionalAte();

    const resultado = await new MigrarPrecoPosPromocao(
      ctx.assinaturaRepo,
      ctx.planoRepo,
      ctx.gateway,
    ).executar({ assinaturaId: assinatura.id, agora });

    expect(resultado.status).toBe("migrada");
    if (resultado.status === "migrada") {
      expect(resultado.assinatura.jaMigradaParaPrecoCheio()).toBe(true);
    }
    expect(ctx.gateway.valoresAtualizados).toHaveLength(1);
    expect(ctx.gateway.valoresAtualizados[0]).toEqual({
      gatewayAssinaturaId: "gw-sub-1",
      valorMensal: 99.9,
    });
  });

  it("segunda chamada na mesma assinatura já migrada é noop e não chama o gateway de novo", async () => {
    const ctx = await criarContextoAssinatura();
    const { assinatura, vaga } = await seedAssinaturaPromocionalPaga(ctx);
    const agora = vaga.calcularPrecoPromocionalAte();
    const uc = new MigrarPrecoPosPromocao(
      ctx.assinaturaRepo,
      ctx.planoRepo,
      ctx.gateway,
    );

    const primeira = await uc.executar({
      assinaturaId: assinatura.id,
      agora,
    });
    expect(primeira.status).toBe("migrada");
    expect(ctx.gateway.valoresAtualizados).toHaveLength(1);

    // Simula persistência pós-primeira migração (Implementador grava o flag)
    if (primeira.status === "migrada") {
      await ctx.assinaturaRepo.salvar(primeira.assinatura);
    }

    const segunda = await uc.executar({
      assinaturaId: assinatura.id,
      agora,
    });

    expect(segunda.status).toBe("noop");
    if (segunda.status === "noop") {
      expect(segunda.motivo).toBe("ja_migrada");
    }
    expect(ctx.gateway.valoresAtualizados).toHaveLength(1);
  });
});
