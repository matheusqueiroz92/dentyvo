export class DadosInvalidosError extends Error {
  readonly nome = "DadosInvalidosError" as const;

  constructor(readonly mensagem: string) {
    super(mensagem);
    this.name = this.nome;
  }
}

export class PermissaoNegadaError extends Error {
  readonly nome = "PermissaoNegadaError" as const;

  constructor(
    readonly papel: string,
    readonly acao: string,
  ) {
    super(`Papel "${papel}" não pode executar a ação "${acao}".`);
    this.name = this.nome;
  }
}

export class TenantMismatchError extends Error {
  readonly nome = "TenantMismatchError" as const;

  constructor(
    readonly clinicaIdEsperada: string,
    readonly clinicaIdRecebida: string,
  ) {
    super("Recurso não pertence à clínica da sessão.");
    this.name = this.nome;
  }
}
