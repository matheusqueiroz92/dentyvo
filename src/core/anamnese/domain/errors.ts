export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class AnamneseNaoEncontradaError extends Error {
  readonly nome = "AnamneseNaoEncontradaError" as const;

  constructor(readonly prontuarioId: string) {
    super("Nenhuma anamnese encontrada para este prontuário.");
    this.name = this.nome;
  }
}

export class AnamneseJaPreenchidaError extends Error {
  readonly nome = "AnamneseJaPreenchidaError" as const;

  constructor(readonly prontuarioId: string) {
    super(
      "Prontuário já possui anamnese; use AtualizarAnamnese para nova versão.",
    );
    this.name = this.nome;
  }
}

export class SecaoAnamneseInvalidaError extends Error {
  readonly nome = "SecaoAnamneseInvalidaError" as const;

  constructor(readonly secao: string) {
    super(
      `Seção "${secao}" inválida: informe texto ou marque como negado/nada a declarar.`,
    );
    this.name = this.nome;
  }
}
