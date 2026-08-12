import { ItemOrcamentoInvalidoError } from "./errors";

export type ItemOrcamentoProps = {
  procedimentoId: string;
  /** Snapshot do nome do procedimento na emissão. */
  nome: string;
  /** Snapshot do valor unitário (ajustável na criação; ≥ 0). */
  valor: number;
  /** Inteiro ≥ 1. */
  quantidade: number;
};

/**
 * Item do orçamento com snapshots de nome/valor (spec 015).
 * Após emissão do orçamento, o item não é editado — correção = novo orçamento.
 */
export class ItemOrcamento {
  readonly procedimentoId: string;
  readonly nome: string;
  readonly valor: number;
  readonly quantidade: number;

  private constructor(props: ItemOrcamentoProps) {
    this.procedimentoId = props.procedimentoId;
    this.nome = props.nome;
    this.valor = props.valor;
    this.quantidade = props.quantidade;
  }

  static criar(input: {
    procedimentoId: string;
    nome: string;
    valor: number;
    quantidade?: number;
  }): ItemOrcamento {
    const procedimentoId = input.procedimentoId.trim();
    if (!procedimentoId) {
      throw new ItemOrcamentoInvalidoError("procedimentoId");
    }

    const nome = input.nome.trim();
    if (!nome) {
      throw new ItemOrcamentoInvalidoError("nome");
    }

    if (!Number.isFinite(input.valor) || input.valor < 0) {
      throw new ItemOrcamentoInvalidoError(
        "valor",
        "Valor do item do orçamento deve ser um número >= 0.",
      );
    }

    const quantidade = input.quantidade ?? 1;
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      throw new ItemOrcamentoInvalidoError(
        "quantidade",
        "Quantidade do item do orçamento deve ser um inteiro >= 1.",
      );
    }

    return new ItemOrcamento({
      procedimentoId,
      nome,
      valor: input.valor,
      quantidade,
    });
  }

  static reconstituir(props: ItemOrcamentoProps): ItemOrcamento {
    return new ItemOrcamento(props);
  }

  /** Subtotal derivado: valor × quantidade. */
  get subtotal(): number {
    return this.valor * this.quantidade;
  }

  paraProps(): ItemOrcamentoProps {
    return {
      procedimentoId: this.procedimentoId,
      nome: this.nome,
      valor: this.valor,
      quantidade: this.quantidade,
    };
  }
}
