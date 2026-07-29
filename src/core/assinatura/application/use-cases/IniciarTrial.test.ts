import { describe, expect, it } from "vitest";

import { AssinaturaJaExisteError } from "../../domain/errors";
import { DURACAO_TRIAL_DIAS } from "../../domain/constants";
import { adicionarDiasCorridos } from "../../domain/Assinatura";
import { CLINICA_ID, criarContextoAssinatura } from "./helpers-test";
import { IniciarTrial } from "./IniciarTrial";

describe("IniciarTrial", () => {
  it("cria assinatura em trialing por 14 dias sem chamar o gateway", async () => {
    const ctx = await criarContextoAssinatura();
    const sut = new IniciarTrial(ctx.assinaturaRepo);
    const dataInicio = new Date("2026-07-01T12:00:00.000Z");

    const assinatura = await sut.executar({
      clinicaId: CLINICA_ID,
      dataInicio,
    });

    expect(assinatura.status).toBe("trialing");
    expect(assinatura.clinicaId).toBe(CLINICA_ID);
    expect(assinatura.gatewayAssinaturaId).toBeNull();
    expect(assinatura.dataFimTrial).toEqual(
      adicionarDiasCorridos(dataInicio, DURACAO_TRIAL_DIAS),
    );

    const persistida = await ctx.assinaturaRepo.buscarPorClinicaId(CLINICA_ID);
    expect(persistida?.id).toBe(assinatura.id);
    expect(ctx.gateway.clientesCriados).toHaveLength(0);
    expect(ctx.gateway.assinaturasCriadas).toHaveLength(0);
  });

  it("não inicia segundo trial se a clínica já possui assinatura", async () => {
    const ctx = await criarContextoAssinatura();
    const sut = new IniciarTrial(ctx.assinaturaRepo);

    await sut.executar({ clinicaId: CLINICA_ID });

    await expect(sut.executar({ clinicaId: CLINICA_ID })).rejects.toBeInstanceOf(
      AssinaturaJaExisteError,
    );
    expect(ctx.assinaturaRepo.items.size).toBe(1);
  });
});
