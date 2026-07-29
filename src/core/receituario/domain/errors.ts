export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class ReceitaNaoEncontradaError extends Error {
  readonly nome = "ReceitaNaoEncontradaError" as const;

  constructor(readonly receitaId: string) {
    super("Receita não encontrada nesta clínica.");
    this.name = this.nome;
  }
}

export class ReceitaSemItensError extends Error {
  readonly nome = "ReceitaSemItensError" as const;

  constructor() {
    super("Receita deve conter ao menos um item.");
    this.name = this.nome;
  }
}

export class ItemReceitaInvalidoError extends Error {
  readonly nome = "ItemReceitaInvalidoError" as const;

  constructor(readonly campo: string) {
    super(`Item da receita inválido: campo "${campo}" é obrigatório.`);
    this.name = this.nome;
  }
}

export class SnapshotCabecalhoInvalidoError extends Error {
  readonly nome = "SnapshotCabecalhoInvalidoError" as const;

  constructor(readonly campo: string) {
    super(`Snapshot de cabeçalho inválido: campo "${campo}" é obrigatório.`);
    this.name = this.nome;
  }
}

export class CroAusenteNaEmissaoError extends Error {
  readonly nome = "CroAusenteNaEmissaoError" as const;

  constructor() {
    super("CRO do profissional é obrigatório para emitir receita.");
    this.name = this.nome;
  }
}
