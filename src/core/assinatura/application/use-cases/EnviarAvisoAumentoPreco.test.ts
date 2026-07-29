import { describe, expect, it } from "vitest";

import {
  ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS,
  PRECO_PROMOCIONAL_CENTAVOS,
} from "../../domain/constants";
import { adicionarDiasCorridos } from "../../domain/Assinatura";
import { chaveNegocioAvisoAumentoPreco } from "../../domain/avisoAumentoPreco";
import { VagaPromocional } from "../../domain/VagaPromocional";
import { EnviarAvisoAumentoPreco } from "./EnviarAvisoAumentoPreco";
import {
  CLINICA_ID,
  PLANO_ID,
  criarContextoAssinatura,
  seedTrialAtivo,
} from "./helpers-test";

const INICIO = new Date("2026-07-01T12:00:00.000Z");

async function seedPromocionalNaJanelaDeAviso(
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
      gatewayClienteId: "cli",
      gatewayAssinaturaId: "sub",
      dataProximaCobranca: INICIO,
    });
  await ctx.assinaturaRepo.salvar(comPromo);
  const agora = adicionarDiasCorridos(
    comPromo.precoPromocionalAte!,
    -ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS,
  );
  return { assinatura: comPromo, agora };
}

describe("EnviarAvisoAumentoPreco (spec 012, D7)", () => {
  it("camada 1: se avisoAumentoPrecoEnviadoEm já preenchido, nunca chama EnviarNotificacao", async () => {
    const ctx = await criarContextoAssinatura();
    const { assinatura, agora } = await seedPromocionalNaJanelaDeAviso(ctx);
    const jaAvisada = assinatura.marcarAvisoAumentoPrecoEnviado(agora);
    await ctx.assinaturaRepo.salvar(jaAvisada);

    const resultado = await new EnviarAvisoAumentoPreco(
      ctx.assinaturaRepo,
      ctx.planoRepo,
      ctx.enviarNotificacao,
    ).executar({
      assinaturaId: assinatura.id,
      destinatarioUsuarioId: ctx.solicitadoPorUsuarioId,
      notificacaoId: "notif-aviso-1",
      agora,
    });

    expect(resultado.status).toBe("noop");
    if (resultado.status === "noop") {
      expect(resultado.motivo).toBe("ja_enviado");
    }
    expect(ctx.enviarNotificacao.chamadas).toHaveLength(0);
  });

  it("sem flag: chama EnviarNotificacao com chaveNegocio e marca avisoAumentoPrecoEnviadoEm", async () => {
    const ctx = await criarContextoAssinatura();
    const { assinatura, agora } = await seedPromocionalNaJanelaDeAviso(ctx);

    const resultado = await new EnviarAvisoAumentoPreco(
      ctx.assinaturaRepo,
      ctx.planoRepo,
      ctx.enviarNotificacao,
    ).executar({
      assinaturaId: assinatura.id,
      destinatarioUsuarioId: ctx.solicitadoPorUsuarioId,
      notificacaoId: "notif-aviso-2",
      agora,
    });

    expect(resultado.status).toBe("enviada");
    expect(ctx.enviarNotificacao.chamadas).toHaveLength(1);
    const chamada = ctx.enviarNotificacao.chamadas[0]!;
    expect(chamada.tipo).toBe("aviso_aumento_preco");
    expect(chamada.canais).toEqual(expect.arrayContaining(["email", "in_app"]));
    expect(chamada.chaveNegocio).toBe(
      chaveNegocioAvisoAumentoPreco(
        assinatura.id,
        assinatura.precoPromocionalAte!,
      ),
    );

    const persistida = await ctx.assinaturaRepo.buscarPorId(assinatura.id);
    expect(persistida?.avisoAumentoPrecoEnviadoEm).toEqual(agora);
  });
});
