import type { Assinatura } from "../../domain/Assinatura";
import { assinaturaPendenteDeAvisoAumentoPreco } from "../../domain/avisoAumentoPreco";
import type { Cobranca } from "../../domain/Cobranca";
import {
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
  MAX_RETRIES_RESERVA_VAGA_POSICAO,
} from "../../domain/constants";
import { VagasPromocionaisEsgotadasError } from "../../domain/errors";
import type { MetodoPagamentoMvp } from "../../domain/MetodoPagamento";
import type { Plano } from "../../domain/Plano";
import { VagaPromocional } from "../../domain/VagaPromocional";
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
import type {
  ReservarVagaPromocionalAtomicoInput,
  VagaPromocionalRepositoryPort,
} from "../ports/VagaPromocionalRepositoryPort";

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

  async listarComAvisoAumentoPrecoPendente(input: {
    agora: Date;
    antecedenciaDias: number;
    limite?: number;
  }): Promise<Assinatura[]> {
    void input.antecedenciaDias;
    const candidatas = [...this.items.values()].filter((a) =>
      assinaturaPendenteDeAvisoAumentoPreco(a, input.agora),
    );
    return input.limite != null
      ? candidatas.slice(0, input.limite)
      : candidatas;
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
  readonly valoresAtualizados: Array<{
    gatewayAssinaturaId: string;
    valorMensal: number;
  }> = [];

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

  async atualizarValorAssinatura(input: {
    gatewayAssinaturaId: string;
    valorMensal: number;
  }): Promise<void> {
    this.valoresAtualizados.push(input);
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

/**
 * Fake in-memory da reserva promocional.
 * **Não** é o adapter de produção: o adapter real deve usar `INSERT … SELECT`
 * atômico (D3). Este fake espelha o **contrato** de retry em
 * `unique_violation` de `posicao` para os testes documentarem o comportamento
 * esperado do adapter.
 */
export class FakeVagaPromocionalRepository
  implements VagaPromocionalRepositoryPort
{
  readonly items = new Map<string, VagaPromocional>();
  /** Contagem de tentativas de insert (inclui retries por conflito de posição). */
  tentativasInsert = 0;
  /**
   * Quantos conflitos de `posicao` injetar antes de gravar com sucesso
   * (simula `unique_violation` sob corrida — o fake retenta na mesma chamada).
   */
  conflitosPosicaoPendentes = 0;

  async reservarAtomico(
    input: ReservarVagaPromocionalAtomicoInput,
  ): Promise<VagaPromocional> {
    const existente = [...this.items.values()].find(
      (v) => v.clinicaId === input.clinicaId,
    );
    if (existente) return existente;

    for (
      let tentativa = 0;
      tentativa < MAX_RETRIES_RESERVA_VAGA_POSICAO;
      tentativa++
    ) {
      this.tentativasInsert += 1;

      if (this.items.size >= LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO) {
        throw new VagasPromocionaisEsgotadasError();
      }

      const posicoesUsadas = new Set(
        [...this.items.values()].map((v) => v.posicao),
      );
      let posicao = 0;
      for (let p = 1; p <= LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO; p++) {
        if (!posicoesUsadas.has(p)) {
          posicao = p;
          break;
        }
      }
      if (posicao === 0) throw new VagasPromocionaisEsgotadasError();

      if (this.conflitosPosicaoPendentes > 0) {
        this.conflitosPosicaoPendentes -= 1;
        // unique_violation em posicao → retry da mesma operação (contrato D3)
        continue;
      }

      const vaga = VagaPromocional.criar({
        posicao,
        clinicaId: input.clinicaId,
        assinaturaId: input.assinaturaId,
        reservadaEm: input.agora,
      });
      this.items.set(`${vaga.clinicaId}:${vaga.posicao}`, vaga);
      return vaga;
    }

    throw new VagasPromocionaisEsgotadasError();
  }

  async buscarPorClinica(clinicaId: string): Promise<VagaPromocional | null> {
    return (
      [...this.items.values()].find((v) => v.clinicaId === clinicaId) ?? null
    );
  }

  async buscarPorAssinaturaId(
    assinaturaId: string,
  ): Promise<VagaPromocional | null> {
    return (
      [...this.items.values()].find((v) => v.assinaturaId === assinaturaId) ??
      null
    );
  }

  async contarReservadas(): Promise<number> {
    return this.items.size;
  }
}

export type MetodoGatewayMvp = MetodoPagamentoMvp;
