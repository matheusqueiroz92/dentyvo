import type { MetodoPagamento, MetodoPagamentoMvp } from "../../domain/MetodoPagamento";
import type { StatusCobranca } from "../../domain/StatusCobranca";

/**
 * Port genérica de gateway de pagamento recorrente (PIX brasileiro).
 * Implementações concretas ficam em `infra/adapters`.
 * Nenhum nome de endpoint, evento ou header de provedor vaza desta interface.
 */

export type CriarClienteGatewayInput = {
  /** Referência externa — tipicamente `clinicaId`. */
  referenciaExterna: string;
  nome: string;
  email: string;
  cpfCnpj: string;
};

export type CriarClienteGatewayResultado = {
  gatewayClienteId: string;
};

export type CriarAssinaturaGatewayInput = {
  gatewayClienteId: string;
  valorMensal: number;
  metodo: MetodoPagamentoMvp;
  descricao: string;
  /** Vencimento da primeira cobrança. */
  proximoVencimento: Date;
};

export type CriarAssinaturaGatewayResultado = {
  gatewayAssinaturaId: string;
  dataProximaCobranca: Date;
};

/** Snapshot genérico de cobrança retornado pelo gateway. */
export type CobrancaGatewaySnapshot = {
  gatewayCobrancaId: string;
  gatewayAssinaturaId: string | null;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusCobranca;
  vencimento: Date;
  pagaEm: Date | null;
  linkPagamento: string | null;
};

export interface AssinaturaGatewayPort {
  criarCliente(
    input: CriarClienteGatewayInput,
  ): Promise<CriarClienteGatewayResultado>;

  criarAssinatura(
    input: CriarAssinaturaGatewayInput,
  ): Promise<CriarAssinaturaGatewayResultado>;

  cancelarAssinatura(gatewayAssinaturaId: string): Promise<void>;

  consultarCobranca(
    gatewayCobrancaId: string,
  ): Promise<CobrancaGatewaySnapshot>;

  listarCobrancasDaAssinatura(
    gatewayAssinaturaId: string,
  ): Promise<CobrancaGatewaySnapshot[]>;
}
