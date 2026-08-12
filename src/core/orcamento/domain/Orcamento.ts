import {
  SnapshotCabecalhoDocumento,
  type SnapshotCabecalhoDocumentoProps,
} from "@/core/shared/SnapshotCabecalhoDocumento";
import {
  DadosInvalidosError,
  TenantMismatchError,
} from "@/core/shared/errors";

import {
  ItemOrcamento,
  type ItemOrcamentoProps,
} from "./ItemOrcamento";
import {
  OrcamentoSemItensError,
  OrcamentoStatusInvalidoError,
} from "./errors";

export const STATUS_ORCAMENTO = ["enviado", "aceito", "recusado"] as const;
export type StatusOrcamento = (typeof STATUS_ORCAMENTO)[number];

export type OrcamentoProps = {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  profissionalId: string;
  status: StatusOrcamento;
  itens: ItemOrcamento[];
  cabecalho: SnapshotCabecalhoDocumento;
  /** Data civil informativa; null = sem prazo sugerido. Não altera status. */
  validoAte: Date | null;
  emitidoEm: Date;
};

export type ItemOrcamentoCriarInput = {
  procedimentoId: string;
  nome: string;
  valor: number;
  quantidade?: number;
};

/**
 * Orçamento comercial vinculado ao prontuário (spec 015).
 *
 * Conteúdo (itens, cabeçalho, `validoAte`) é **imutável** após emissão.
 * Status transiciona apenas via `aceitar()` / `recusar()` a partir de
 * `enviado` — única fonte de verdade sobre transições válidas.
 *
 * Diferente de Receita/Atestado: status muda; conteúdo não.
 */
export class Orcamento {
  readonly id: string;
  readonly clinicaId: string;
  readonly prontuarioId: string;
  readonly profissionalId: string;
  readonly status: StatusOrcamento;
  readonly itens: readonly ItemOrcamento[];
  readonly cabecalho: SnapshotCabecalhoDocumento;
  readonly validoAte: Date | null;
  readonly emitidoEm: Date;

  private constructor(props: OrcamentoProps) {
    this.id = props.id;
    this.clinicaId = props.clinicaId;
    this.prontuarioId = props.prontuarioId;
    this.profissionalId = props.profissionalId;
    this.status = props.status;
    this.itens = props.itens;
    this.cabecalho = props.cabecalho;
    this.validoAte = props.validoAte;
    this.emitidoEm = props.emitidoEm;
  }

  /**
   * Emite orçamento já como `enviado` (sem rascunho no MVP).
   * `profissionalId` deve ser o da sessão.
   * `validoAte` opcional — informativo; sem efeito em status.
   */
  static emitir(input: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    itens: Array<ItemOrcamento | ItemOrcamentoCriarInput>;
    cabecalho: SnapshotCabecalhoDocumentoProps | SnapshotCabecalhoDocumento;
    validoAte?: Date | null;
    emitidoEm?: Date;
  }): Orcamento {
    const itens = normalizarItens(input.itens);
    if (itens.length === 0) {
      throw new OrcamentoSemItensError();
    }

    const emitidoEm = input.emitidoEm ?? new Date();
    assertDataValida(emitidoEm, "emitidoEm");

    const cabecalho =
      input.cabecalho instanceof SnapshotCabecalhoDocumento
        ? input.cabecalho
        : SnapshotCabecalhoDocumento.criar(input.cabecalho);

    return new Orcamento({
      id: assertCampo(input.id, "id"),
      clinicaId: assertCampo(input.clinicaId, "clinicaId"),
      prontuarioId: assertCampo(input.prontuarioId, "prontuarioId"),
      profissionalId: assertCampo(input.profissionalId, "profissionalId"),
      status: "enviado",
      itens,
      cabecalho,
      validoAte: normalizarValidoAte(input.validoAte),
      emitidoEm,
    });
  }

  static reconstituir(props: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    status: StatusOrcamento;
    itens: Array<ItemOrcamentoProps | ItemOrcamento>;
    cabecalho: SnapshotCabecalhoDocumentoProps | SnapshotCabecalhoDocumento;
    validoAte: Date | null;
    emitidoEm: Date;
  }): Orcamento {
    const cabecalho =
      props.cabecalho instanceof SnapshotCabecalhoDocumento
        ? props.cabecalho
        : SnapshotCabecalhoDocumento.reconstituir(props.cabecalho);

    const itens = props.itens.map((i) =>
      i instanceof ItemOrcamento ? i : ItemOrcamento.reconstituir(i),
    );

    return new Orcamento({
      id: props.id,
      clinicaId: props.clinicaId,
      prontuarioId: props.prontuarioId,
      profissionalId: props.profissionalId,
      status: props.status,
      itens,
      cabecalho,
      validoAte: props.validoAte,
      emitidoEm: props.emitidoEm,
    });
  }

  /** Total derivado: Σ (valor × quantidade). */
  get total(): number {
    return this.itens.reduce((acc, item) => acc + item.subtotal, 0);
  }

  estaEnviado(): boolean {
    return this.status === "enviado";
  }

  estaAceito(): boolean {
    return this.status === "aceito";
  }

  /**
   * Transição `enviado` → `aceito`.
   * Retorna nova instância (conteúdo congelado; só status muda).
   */
  aceitar(): Orcamento {
    if (this.status !== "enviado") {
      throw new OrcamentoStatusInvalidoError(this.status, "aceitar");
    }
    return new Orcamento({
      id: this.id,
      clinicaId: this.clinicaId,
      prontuarioId: this.prontuarioId,
      profissionalId: this.profissionalId,
      status: "aceito",
      itens: [...this.itens],
      cabecalho: this.cabecalho,
      validoAte: this.validoAte,
      emitidoEm: this.emitidoEm,
    });
  }

  /**
   * Transição `enviado` → `recusado`.
   * Retorna nova instância (conteúdo congelado; só status muda).
   */
  recusar(): Orcamento {
    if (this.status !== "enviado") {
      throw new OrcamentoStatusInvalidoError(this.status, "recusar");
    }
    return new Orcamento({
      id: this.id,
      clinicaId: this.clinicaId,
      prontuarioId: this.prontuarioId,
      profissionalId: this.profissionalId,
      status: "recusado",
      itens: [...this.itens],
      cabecalho: this.cabecalho,
      validoAte: this.validoAte,
      emitidoEm: this.emitidoEm,
    });
  }

  assertPertenceAClinica(clinicaId: string): void {
    if (this.clinicaId !== clinicaId) {
      throw new TenantMismatchError(clinicaId, this.clinicaId);
    }
  }
}

function normalizarItens(
  itens: Array<ItemOrcamento | ItemOrcamentoCriarInput>,
): ItemOrcamento[] {
  return itens.map((item) =>
    item instanceof ItemOrcamento ? item : ItemOrcamento.criar(item),
  );
}

function normalizarValidoAte(
  valor: Date | null | undefined,
): Date | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  assertDataValida(valor, "validoAte");
  return valor;
}

function assertCampo(valor: string, campo: string): string {
  const trimmed = valor.trim();
  if (!trimmed) {
    throw new DadosInvalidosError(`${campo} do orçamento é obrigatório.`);
  }
  return trimmed;
}

function assertDataValida(data: Date, campo: string): void {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    throw new DadosInvalidosError(`${campo} inválida.`);
  }
}
