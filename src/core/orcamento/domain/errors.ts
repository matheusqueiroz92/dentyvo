export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export { SnapshotCabecalhoInvalidoError } from "@/core/shared/SnapshotCabecalhoDocumento";

export class OrcamentoNaoEncontradoError extends Error {
  readonly nome = "OrcamentoNaoEncontradoError" as const;

  constructor(readonly orcamentoId: string) {
    super("Orçamento não encontrado nesta clínica.");
    this.name = this.nome;
  }
}

export class OrcamentoSemItensError extends Error {
  readonly nome = "OrcamentoSemItensError" as const;

  constructor() {
    super("Orçamento deve ter ao menos um item.");
    this.name = this.nome;
  }
}

export class ItemOrcamentoInvalidoError extends Error {
  readonly nome = "ItemOrcamentoInvalidoError" as const;

  constructor(readonly campo: string, detalhe?: string) {
    super(
      detalhe ??
        `Item do orçamento inválido: campo "${campo}" é obrigatório ou inválido.`,
    );
    this.name = this.nome;
  }
}

/**
 * Transição de status inválida na entidade já carregada
 * (ex.: aceitar/recusar quando não está `enviado`).
 * Única fonte de verdade de domínio: métodos `aceitar()` / `recusar()`.
 */
export class OrcamentoStatusInvalidoError extends Error {
  readonly nome = "OrcamentoStatusInvalidoError" as const;

  constructor(
    readonly statusAtual: string,
    readonly operacao: "aceitar" | "recusar",
  ) {
    super(
      `Não é possível ${operacao} orçamento com status "${statusAtual}". Somente orçamentos "enviado" podem transicionar.`,
    );
    this.name = this.nome;
  }
}

/**
 * Conflito de concorrência na persistência da transição de status
 * (UPDATE condicional afetou 0 linhas: status no banco já saiu de `enviado`
 * entre a leitura e a escrita). Contrato de
 * `OrcamentoRepositoryPort.atualizarStatus`.
 */
export class OrcamentoStatusConflitoError extends Error {
  readonly nome = "OrcamentoStatusConflitoError" as const;

  constructor(readonly orcamentoId: string) {
    super(
      "Orçamento já teve o status alterado por outra operação. Recarregue e tente novamente.",
    );
    this.name = this.nome;
  }
}
