import type { Assinatura } from "../../domain/Assinatura";
import type { Cobranca } from "../../domain/Cobranca";
import type { MetodoPagamentoMvp } from "../../domain/MetodoPagamento";
import type { Plano } from "../../domain/Plano";
import type {
  AssinaturaGatewayPort,
  CobrancaGatewaySnapshot,
  CriarAssinaturaGatewayInput,
  CriarAssinaturaGatewayResultado,
  CriarClienteGatewayInput,
  CriarClienteGatewayResultado,
} from "../ports/AssinaturaGatewayPort";
import type { AssinaturaRepositoryPort } from "../ports/AssinaturaRepositoryPort";
import type { CobrancaRepositoryPort } from "../ports/CobrancaRepositoryPort";
import type { EventoWebhookProcessadoPort } from "../ports/EventoWebhookProcessadoPort";
import type { PlanoRepositoryPort } from "../ports/PlanoRepositoryPort";

export class FakeAssinaturaRepository implements AssinaturaRepositoryPort {
  readonly items = new Map<string, Assinatura>();

  async salvar(assinatura: Assinatura): Promise<void> {
    this.items.set(assinatura.id, assinatura);
  }

  async buscarPorId(id: string): Promise<Assinatura | null> {
    return this.items.get(id) ?? null;
  }

  async buscarPorClinicaId(clinicaId: string): Promise<Assinatura | null> {
    return (
      [...this.items.values()].find((a) => a.clinicaId === clinicaId) ?? null
    );
  }

  async buscarPorGatewayAssinaturaId(
    gatewayAssinaturaId: string,
  ): Promise<Assinatura | null> {
    return (
      [...this.items.values()].find(
        (a) => a.gatewayAssinaturaId === gatewayAssinaturaId,
      ) ?? null
    );
  }
}

export class FakeCobrancaRepository implements CobrancaRepositoryPort {
  readonly items = new Map<string, Cobranca>();

  async salvar(cobranca: Cobranca): Promise<void> {
    this.items.set(cobranca.id, cobranca);
  }

  async buscarPorId(id: string): Promise<Cobranca | null> {
    return this.items.get(id) ?? null;
  }

  async buscarPorGatewayCobrancaId(
    gatewayCobrancaId: string,
  ): Promise<Cobranca | null> {
    return (
      [...this.items.values()].find(
        (c) => c.gatewayCobrancaId === gatewayCobrancaId,
      ) ?? null
    );
  }

  async listarPorAssinaturaId(assinaturaId: string): Promise<Cobranca[]> {
    return [...this.items.values()].filter(
      (c) => c.assinaturaId === assinaturaId,
    );
  }
}

export class FakePlanoRepository implements PlanoRepositoryPort {
  readonly items = new Map<string, Plano>();

  async salvar(plano: Plano): Promise<void> {
    this.items.set(plano.id, plano);
  }

  async buscarPorId(id: string): Promise<Plano | null> {
    return this.items.get(id) ?? null;
  }

  async listarAtivos(): Promise<Plano[]> {
    return [...this.items.values()];
  }
}

/**
 * Fake de idempotência — recebe apenas `eventoId` opaco (vocabulário genérico).
 * Nenhum nome de evento de provedor aparece aqui.
 */
export class FakeEventoWebhookProcessadoPort
  implements EventoWebhookProcessadoPort
{
  readonly processados = new Set<string>();

  async jaProcessado(eventoId: string): Promise<boolean> {
    return this.processados.has(eventoId);
  }

  async marcarProcessado(eventoId: string, _processadoEm?: Date): Promise<void> {
    void _processadoEm;
    this.processados.add(eventoId);
  }
}

export class FakeAssinaturaGateway implements AssinaturaGatewayPort {
  readonly clientesCriados: CriarClienteGatewayInput[] = [];
  readonly assinaturasCriadas: CriarAssinaturaGatewayInput[] = [];
  readonly cobrancas = new Map<string, CobrancaGatewaySnapshot>();
  cancelamentos: string[] = [];

  proximoClienteId = "gw-cli-1";
  proximoAssinaturaId = "gw-sub-1";

  async criarCliente(
    input: CriarClienteGatewayInput,
  ): Promise<CriarClienteGatewayResultado> {
    this.clientesCriados.push(input);
    return { gatewayClienteId: this.proximoClienteId };
  }

  async criarAssinatura(
    input: CriarAssinaturaGatewayInput,
  ): Promise<CriarAssinaturaGatewayResultado> {
    this.assinaturasCriadas.push(input);
    return {
      gatewayAssinaturaId: this.proximoAssinaturaId,
      dataProximaCobranca: input.proximoVencimento,
    };
  }

  async cancelarAssinatura(gatewayAssinaturaId: string): Promise<void> {
    this.cancelamentos.push(gatewayAssinaturaId);
  }

  async consultarCobranca(
    gatewayCobrancaId: string,
  ): Promise<CobrancaGatewaySnapshot> {
    const encontrada = this.cobrancas.get(gatewayCobrancaId);
    if (!encontrada) {
      throw new Error(`Cobrança fake não encontrada: ${gatewayCobrancaId}`);
    }
    return encontrada;
  }

  async listarCobrancasDaAssinatura(
    gatewayAssinaturaId: string,
  ): Promise<CobrancaGatewaySnapshot[]> {
    return [...this.cobrancas.values()].filter(
      (c) => c.gatewayAssinaturaId === gatewayAssinaturaId,
    );
  }

  /** Helper de teste — registra snapshot genérico (status/método do domínio). */
  registrarCobranca(snapshot: CobrancaGatewaySnapshot): void {
    this.cobrancas.set(snapshot.gatewayCobrancaId, snapshot);
  }
}

export type MetodoGatewayMvp = MetodoPagamentoMvp;
