export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class ProntuarioNaoEncontradoError extends Error {
  readonly nome = "ProntuarioNaoEncontradoError" as const;

  constructor(readonly prontuarioId: string) {
    super("Prontuário não encontrado nesta clínica.");
    this.name = this.nome;
  }
}

export class ProntuarioJaExisteError extends Error {
  readonly nome = "ProntuarioJaExisteError" as const;

  constructor(readonly pacienteId: string) {
    super("Paciente já possui prontuário nesta clínica.");
    this.name = this.nome;
  }
}

export class EvolucaoNaoEncontradaError extends Error {
  readonly nome = "EvolucaoNaoEncontradaError" as const;

  constructor(readonly evolucaoId: string) {
    super("Evolução não encontrada nesta clínica.");
    this.name = this.nome;
  }
}

export class EvolucaoJaRetificadaError extends Error {
  readonly nome = "EvolucaoJaRetificadaError" as const;

  constructor(readonly evolucaoId: string) {
    super("Evolução já possui retificação; o MVP não permite nova retificação.");
    this.name = this.nome;
  }
}

export class RetificacaoInvalidaError extends Error {
  readonly nome = "RetificacaoInvalidaError" as const;

  constructor(readonly mensagem: string) {
    super(mensagem);
    this.name = this.nome;
  }
}
