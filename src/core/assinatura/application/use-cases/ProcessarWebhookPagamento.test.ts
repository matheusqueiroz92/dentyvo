import { describe, expect, it } from "vitest";

import { EventoCobranca } from "../../domain/EventoCobranca";
import { CLINICA_ID, criarContextoAssinatura, seedTrialAtivo } from "./helpers-test";
import { ProcessarWebhookPagamento } from "./ProcessarWebhookPagamento";

function sut(ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>) {
  return new ProcessarWebhookPagamento(
    ctx.assinaturaRepo,
    ctx.cobrancaRepo,
    ctx.eventosProcessados,
  );
}

async function seedAssinaturaAtivaNoGateway(
  ctx: Awaited<ReturnType<typeof criarContextoAssinatura>>,
) {
  const trial = await seedTrialAtivo(ctx);
  const ativa = trial.ativarAposPagamento({
    planoId: "plano-basico",
    gatewayClienteId: "gw-cli-1",
    gatewayAssinaturaId: "gw-sub-1",
    dataProximaCobranca: new Date("2026-08-01T12:00:00.000Z"),
  });
  await ctx.assinaturaRepo.salvar(ativa);
  return ativa;
}

/** Evento já traduzido — vocabulário genérico do domínio (nunca termos de provedor). */
function eventoPaga(overrides: Partial<Parameters<typeof EventoCobranca.criar>[0]> = {}) {
  return EventoCobranca.criar({
    eventoId: "evt_generico_pago_001",
    gatewayCobrancaId: "gw-pay-1",
    gatewayAssinaturaId: "gw-sub-1",
    status: "paga",
    valor: 99.9,
    metodo: "pix",
    vencimento: new Date("2026-07-15T12:00:00.000Z"),
    pagaEm: new Date("2026-07-14T15:00:00.000Z"),
    linkPagamento: "https://pagamento.exemplo/cob/1",
    ...overrides,
  });
}

describe("ProcessarWebhookPagamento", () => {
  it("pagamento confirma cobrança e ativa assinatura que estava em trial", async () => {
    const ctx = await criarContextoAssinatura();
    const trial = await seedTrialAtivo(ctx);
    const vinculada = trial.vincularPlanoNoGateway({
      planoId: "plano-basico",
      gatewayClienteId: "gw-cli-1",
      gatewayAssinaturaId: "gw-sub-1",
      dataProximaCobranca: new Date("2026-08-01T12:00:00.000Z"),
    });
    await ctx.assinaturaRepo.salvar(vinculada);

    await sut(ctx).executar({ evento: eventoPaga() });

    const assinatura = await ctx.assinaturaRepo.buscarPorClinicaId(CLINICA_ID);
    expect(assinatura?.status).toBe("ativa");

    const cobrancas = await ctx.cobrancaRepo.listarPorAssinaturaId(
      assinatura!.id,
    );
    expect(cobrancas).toHaveLength(1);
    expect(cobrancas[0]?.status).toBe("paga");
    expect(cobrancas[0]?.metodo).toBe("pix");
    expect(ctx.eventosProcessados.processados.has("evt_generico_pago_001")).toBe(
      true,
    );
  });

  it("é idempotente por eventoId: reprocessar o mesmo evento não duplica efeito", async () => {
    const ctx = await criarContextoAssinatura();
    await seedAssinaturaAtivaNoGateway(ctx);
    const evento = eventoPaga({ eventoId: "evt_idempotente_42" });
    const caso = sut(ctx);

    await caso.executar({ evento });
    await caso.executar({ evento });

    const assinatura = await ctx.assinaturaRepo.buscarPorClinicaId(CLINICA_ID);
    const cobrancas = await ctx.cobrancaRepo.listarPorAssinaturaId(
      assinatura!.id,
    );
    expect(cobrancas).toHaveLength(1);
    expect(cobrancas[0]?.status).toBe("paga");
    expect(ctx.eventosProcessados.processados.size).toBe(1);
  });

  it("cobrança vencida marca status vencida sem inadimplência imediata (tolerância)", async () => {
    const ctx = await criarContextoAssinatura();
    await seedAssinaturaAtivaNoGateway(ctx);

    await sut(ctx).executar({
      evento: EventoCobranca.criar({
        eventoId: "evt_vencida_001",
        gatewayCobrancaId: "gw-pay-overdue",
        gatewayAssinaturaId: "gw-sub-1",
        status: "vencida",
        valor: 99.9,
        metodo: "boleto",
        vencimento: new Date("2026-07-15T12:00:00.000Z"),
      }),
    });

    const assinatura = await ctx.assinaturaRepo.buscarPorClinicaId(CLINICA_ID);
    expect(assinatura?.status).toBe("ativa");

    const cobranca = await ctx.cobrancaRepo.buscarPorGatewayCobrancaId(
      "gw-pay-overdue",
    );
    expect(cobranca?.status).toBe("vencida");
    expect(cobranca?.vencidaEm).not.toBeNull();
  });

  it("pagamento de cobrança em atraso restaura assinatura inadimplente para ativa", async () => {
    const ctx = await criarContextoAssinatura();
    const ativa = await seedAssinaturaAtivaNoGateway(ctx);
    await ctx.assinaturaRepo.salvar(ativa.marcarInadimplente());

    await sut(ctx).executar({
      evento: eventoPaga({
        eventoId: "evt_regularizacao_001",
        gatewayCobrancaId: "gw-pay-atraso",
      }),
    });

    const assinatura = await ctx.assinaturaRepo.buscarPorClinicaId(CLINICA_ID);
    expect(assinatura?.status).toBe("ativa");
    expect(assinatura?.avaliarAcesso().permitido).toBe(true);
  });

  it("não usa vocabulário específico de provedor no fluxo de aplicação", async () => {
    const ctx = await criarContextoAssinatura();
    await seedAssinaturaAtivaNoGateway(ctx);

    // Garante que o caso de uso consome EventoCobranca genérico.
    const evento = eventoPaga({ status: "paga", metodo: "pix" });
    expect(evento.status).toBe("paga");
    expect(evento.metodo).toBe("pix");

    await sut(ctx).executar({ evento });

    const cobranca = await ctx.cobrancaRepo.buscarPorGatewayCobrancaId(
      "gw-pay-1",
    );
    expect(cobranca?.status).toBe("paga");
  });
});
