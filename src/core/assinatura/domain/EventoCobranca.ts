import { DadosInvalidosError } from "@/core/shared/errors";

import {
  assertMetodoPagamento,
  type MetodoPagamento,
} from "./MetodoPagamento";
import {
  assertStatusCobranca,
  type StatusCobranca,
} from "./StatusCobranca";

/**
 * Evento genérico de cobrança já traduzido pelo adapter do gateway.
 * Application/domínio nunca vê nomes de evento de provedor.
 */
export type EventoCobrancaProps = {
  /** Id opaco do evento no gateway — chave de idempotência. */
  eventoId: string;
  gatewayCobrancaId: string;
  gatewayAssinaturaId: string | null;
  status: StatusCobranca;
  valor: number;
  metodo: MetodoPagamento;
  vencimento: Date;
  pagaEm: Date | null;
  linkPagamento: string | null;
  ocorridoEm: Date;
};

export class EventoCobranca {
  readonly eventoId: string;
  readonly gatewayCobrancaId: string;
  readonly gatewayAssinaturaId: string | null;
  readonly status: StatusCobranca;
  readonly valor: number;
  readonly metodo: MetodoPagamento;
  readonly vencimento: Date;
  readonly pagaEm: Date | null;
  readonly linkPagamento: string | null;
  readonly ocorridoEm: Date;

  private constructor(props: EventoCobrancaProps) {
    this.eventoId = props.eventoId;
    this.gatewayCobrancaId = props.gatewayCobrancaId;
    this.gatewayAssinaturaId = props.gatewayAssinaturaId;
    this.status = props.status;
    this.valor = props.valor;
    this.metodo = props.metodo;
    this.vencimento = props.vencimento;
    this.pagaEm = props.pagaEm;
    this.linkPagamento = props.linkPagamento;
    this.ocorridoEm = props.ocorridoEm;
  }

  static criar(input: {
    eventoId: string;
    gatewayCobrancaId: string;
    gatewayAssinaturaId?: string | null;
    status: StatusCobranca | string;
    valor: number;
    metodo: MetodoPagamento | string;
    vencimento: Date;
    pagaEm?: Date | null;
    linkPagamento?: string | null;
    ocorridoEm?: Date;
  }): EventoCobranca {
    const eventoId = input.eventoId.trim();
    const gatewayCobrancaId = input.gatewayCobrancaId.trim();
    if (!eventoId) {
      throw new DadosInvalidosError("eventoId é obrigatório.");
    }
    if (!gatewayCobrancaId) {
      throw new DadosInvalidosError("gatewayCobrancaId é obrigatório.");
    }
    if (
      typeof input.valor !== "number" ||
      !Number.isFinite(input.valor) ||
      input.valor < 0
    ) {
      throw new DadosInvalidosError("valor do evento de cobrança é inválido.");
    }
    assertDataValida(input.vencimento, "vencimento");
    const ocorridoEm = input.ocorridoEm ?? new Date();
    assertDataValida(ocorridoEm, "ocorridoEm");
    if (input.pagaEm != null) {
      assertDataValida(input.pagaEm, "pagaEm");
    }

    const gatewayAssinaturaId =
      input.gatewayAssinaturaId == null
        ? null
        : input.gatewayAssinaturaId.trim() || null;

    return new EventoCobranca({
      eventoId,
      gatewayCobrancaId,
      gatewayAssinaturaId,
      status: assertStatusCobranca(input.status),
      valor: input.valor,
      metodo: assertMetodoPagamento(input.metodo),
      vencimento: input.vencimento,
      pagaEm: input.pagaEm ?? null,
      linkPagamento: normalizarOpcional(input.linkPagamento),
      ocorridoEm,
    });
  }
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}

function normalizarOpcional(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  const trimmed = valor.trim();
  return trimmed.length > 0 ? trimmed : null;
}
