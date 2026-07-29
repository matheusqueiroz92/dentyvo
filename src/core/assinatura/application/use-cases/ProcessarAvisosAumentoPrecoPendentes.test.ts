import { describe, expect, it } from "vitest";

import {
  ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS,
  PRECO_PROMOCIONAL_CENTAVOS,
} from "../../domain/constants";
import { adicionarDiasCorridos } from "../../domain/Assinatura";
import { VagaPromocional } from "../../domain/VagaPromocional";
import { EnviarAvisoAumentoPreco } from "./EnviarAvisoAumentoPreco";
import {
  CLINICA_ID,
  PLANO_ID,
  criarContextoAssinatura,
  seedTrialAtivo,
} from "./helpers-test";
import { ProcessarAvisosAumentoPrecoPendentes } from "./ProcessarAvisosAumentoPrecoPendentes";

const INICIO = new Date("2026-07-01T12:00:00.000Z");

describe("ProcessarAvisosAumentoPrecoPendentes (spec 012)", () => {
  it("processa candidatas na janela e conta enviados", async () => {
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

    const agora = adicionarDiasCorridos(
      comPromo.precoPromocionalAte!,
      -ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS,
    );

    const enviarAviso = new EnviarAvisoAumentoPreco(
      ctx.assinaturaRepo,
      ctx.planoRepo,
      ctx.enviarNotificacao,
    );

    const resultado = await new ProcessarAvisosAumentoPrecoPendentes(
      ctx.assinaturaRepo,
      enviarAviso,
    ).executar({ agora, limite: 10 });

    expect(resultado.processados).toBeGreaterThanOrEqual(1);
    expect(resultado.enviados).toBeGreaterThanOrEqual(1);
  });
});
