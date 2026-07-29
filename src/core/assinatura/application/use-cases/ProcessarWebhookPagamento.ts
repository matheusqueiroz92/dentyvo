import { randomUUID } from "node:crypto";

import { Cobranca } from "../../domain/Cobranca";
import type { EventoCobranca } from "../../domain/EventoCobranca";
import { AssinaturaNaoEncontradaError } from "../../domain/errors";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import type { CobrancaRepositoryPort } from "../ports/CobrancaRepositoryPort";
import type { EventoWebhookProcessadoPort } from "../ports/EventoWebhookProcessadoPort";

export type ProcessarWebhookPagamentoInput = {
  /**
   * Evento já validado e traduzido pelo adapter do gateway
   * (vocabulário do domínio: status/método genéricos + `eventoId` opaco).
   */
  evento: EventoCobranca;
};

/**
 * Atualiza `Cobranca`/`Assinatura` a partir de evento genérico de cobrança.
 * Idempotente por `evento.eventoId` (entrega at-least-once).
 *
 * Validação de segredo do webhook ocorre no adapter HTTP (infra), antes
 * de montar `EventoCobranca` e chamar este caso de uso.
 *
 * Assinatura: `ProcessarWebhookPagamento(evento) → void`
 */
export class ProcessarWebhookPagamento {
  constructor(
    private readonly assinaturaRepo: AssinaturaRepositoryPort,
    private readonly cobrancaRepo: CobrancaRepositoryPort,
    private readonly eventosProcessados: EventoWebhookProcessadoPort,
  ) {}

  async executar(input: ProcessarWebhookPagamentoInput): Promise<void> {
    const { evento } = input;

    if (await this.eventosProcessados.jaProcessado(evento.eventoId)) {
      return;
    }

    if (!evento.gatewayAssinaturaId) {
      await this.eventosProcessados.marcarProcessado(evento.eventoId);
      return;
    }

    const assinatura = await this.assinaturaRepo.buscarPorGatewayAssinaturaId(
      evento.gatewayAssinaturaId,
    );
    if (!assinatura) {
      throw new AssinaturaNaoEncontradaError(evento.gatewayAssinaturaId);
    }

    let cobranca = await this.cobrancaRepo.buscarPorGatewayCobrancaId(
      evento.gatewayCobrancaId,
    );

    if (!cobranca) {
      cobranca = Cobranca.criar({
        id: randomUUID(),
        assinaturaId: assinatura.id,
        gatewayCobrancaId: evento.gatewayCobrancaId,
        valor: evento.valor,
        metodo: evento.metodo,
        vencimento: evento.vencimento,
        status: "pendente",
        linkPagamento: evento.linkPagamento,
      });
    } else if (evento.linkPagamento) {
      cobranca = cobranca.comLinkPagamento(evento.linkPagamento);
    }

    cobranca = aplicarStatusCobranca(cobranca, evento);

    await this.cobrancaRepo.salvar(cobranca);

    let assinaturaAtualizada = assinatura;

    if (evento.status === "paga") {
      if (assinatura.status === "trialing") {
        if (
          assinatura.planoId &&
          assinatura.gatewayClienteId &&
          assinatura.gatewayAssinaturaId
        ) {
          assinaturaAtualizada = assinatura.ativarAposPagamento({
            planoId: assinatura.planoId,
            gatewayClienteId: assinatura.gatewayClienteId,
            gatewayAssinaturaId: assinatura.gatewayAssinaturaId,
            dataProximaCobranca: assinatura.dataProximaCobranca,
          });
        }
      } else if (assinatura.status === "inadimplente") {
        assinaturaAtualizada = assinatura.restaurarAposPagamento();
      }
    } else if (
      evento.status === "vencida" &&
      assinatura.deveMarcarInadimplentePorCobranca(cobranca)
    ) {
      assinaturaAtualizada = assinatura.marcarInadimplente();
    }

    if (assinaturaAtualizada !== assinatura) {
      await this.assinaturaRepo.salvar(assinaturaAtualizada);
    }

    await this.eventosProcessados.marcarProcessado(evento.eventoId);
  }
}

function aplicarStatusCobranca(
  cobranca: Cobranca,
  evento: EventoCobranca,
): Cobranca {
  if (evento.status === cobranca.status) {
    return cobranca;
  }

  if (evento.status === "paga") {
    if (cobranca.status === "pendente" || cobranca.status === "vencida") {
      return cobranca.marcarPaga(evento.pagaEm ?? evento.ocorridoEm);
    }
    return cobranca;
  }

  if (evento.status === "vencida") {
    if (cobranca.status === "pendente") {
      return cobranca.marcarVencida(evento.ocorridoEm);
    }
    return cobranca;
  }

  if (evento.status === "estornada") {
    if (cobranca.status === "paga" || cobranca.status === "vencida") {
      return cobranca.marcarEstornada();
    }
    return cobranca;
  }

  return cobranca;
}
