import { DadosInvalidosError } from "@/core/shared/errors";

import {
  assertMetodoPagamento,
  type MetodoPagamento,
} from "./MetodoPagamento";
import {
  assertStatusCobranca,
  type StatusCobranca,
} from "./StatusCobranca";
import { TransicaoStatusCobrancaInvalidaError } from "./errors";

export type CobrancaProps = {
  id: string;
  assinaturaId: string;
  /** Id opaco da cobrança no gateway de pagamento. */
  gatewayCobrancaId: string;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusCobranca;
  vencimento: Date;
  pagaEm: Date | null;
  /**
   * Momento em que a cobrança passou a `vencida` (para tolerância de 3 dias).
   * Null enquanto não estiver vencida.
   */
  vencidaEm: Date | null;
  /** URL/código para regularizar pagamento, quando o gateway fornecer. */
  linkPagamento: string | null;
};

const TRANSICOES_COBRANCA: Record<StatusCobranca, readonly StatusCobranca[]> = {
  pendente: ["paga", "vencida"],
  vencida: ["paga", "estornada"],
  paga: ["estornada"],
  estornada: [],
};

/**
 * Cobrança recorrente vinculada a uma assinatura (spec 010).
 * Status e método usam vocabulário do domínio — nunca termos de provedor.
 */
export class Cobranca {
  readonly id: string;
  readonly assinaturaId: string;
  readonly gatewayCobrancaId: string;
  readonly valor: number;
  readonly metodo: MetodoPagamento;
  readonly status: StatusCobranca;
  readonly vencimento: Date;
  readonly pagaEm: Date | null;
  readonly vencidaEm: Date | null;
  readonly linkPagamento: string | null;

  private constructor(props: CobrancaProps) {
    this.id = props.id;
    this.assinaturaId = props.assinaturaId;
    this.gatewayCobrancaId = props.gatewayCobrancaId;
    this.valor = props.valor;
    this.metodo = props.metodo;
    this.status = props.status;
    this.vencimento = props.vencimento;
    this.pagaEm = props.pagaEm;
    this.vencidaEm = props.vencidaEm;
    this.linkPagamento = props.linkPagamento;
  }

  static criar(input: {
    id: string;
    assinaturaId: string;
    gatewayCobrancaId: string;
    valor: number;
    metodo: MetodoPagamento | string;
    vencimento: Date;
    status?: StatusCobranca | string;
    linkPagamento?: string | null;
  }): Cobranca {
    const id = input.id.trim();
    const assinaturaId = input.assinaturaId.trim();
    const gatewayCobrancaId = input.gatewayCobrancaId.trim();
    if (!id) throw new DadosInvalidosError("Id da cobrança é obrigatório.");
    if (!assinaturaId) {
      throw new DadosInvalidosError("assinaturaId da cobrança é obrigatório.");
    }
    if (!gatewayCobrancaId) {
      throw new DadosInvalidosError("gatewayCobrancaId é obrigatório.");
    }
    if (
      typeof input.valor !== "number" ||
      !Number.isFinite(input.valor) ||
      input.valor < 0
    ) {
      throw new DadosInvalidosError("valor da cobrança é inválido.");
    }
    assertDataValida(input.vencimento, "vencimento");

    return new Cobranca({
      id,
      assinaturaId,
      gatewayCobrancaId,
      valor: input.valor,
      metodo: assertMetodoPagamento(input.metodo),
      status: assertStatusCobranca(input.status ?? "pendente"),
      vencimento: input.vencimento,
      pagaEm: null,
      vencidaEm: null,
      linkPagamento: normalizarOpcional(input.linkPagamento),
    });
  }

  static reconstituir(props: CobrancaProps): Cobranca {
    return new Cobranca(props);
  }

  marcarPaga(pagaEm: Date = new Date()): Cobranca {
    this.assertPodeTransicionarPara("paga");
    assertDataValida(pagaEm, "pagaEm");
    return this.clonar({
      status: "paga",
      pagaEm,
      vencidaEm: null,
    });
  }

  marcarVencida(vencidaEm: Date = new Date()): Cobranca {
    this.assertPodeTransicionarPara("vencida");
    assertDataValida(vencidaEm, "vencidaEm");
    return this.clonar({
      status: "vencida",
      vencidaEm,
      pagaEm: null,
    });
  }

  marcarEstornada(): Cobranca {
    this.assertPodeTransicionarPara("estornada");
    return this.clonar({
      status: "estornada",
    });
  }

  comLinkPagamento(link: string | null): Cobranca {
    return this.clonar({
      linkPagamento: normalizarOpcional(link),
    });
  }

  private assertPodeTransicionarPara(destino: StatusCobranca): void {
    if (!TRANSICOES_COBRANCA[this.status].includes(destino)) {
      throw new TransicaoStatusCobrancaInvalidaError(this.status, destino);
    }
  }

  private clonar(patch: Partial<CobrancaProps>): Cobranca {
    return new Cobranca({
      id: this.id,
      assinaturaId: this.assinaturaId,
      gatewayCobrancaId: this.gatewayCobrancaId,
      valor: this.valor,
      metodo: this.metodo,
      status: this.status,
      vencimento: this.vencimento,
      pagaEm: this.pagaEm,
      vencidaEm: this.vencidaEm,
      linkPagamento: this.linkPagamento,
      ...patch,
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
