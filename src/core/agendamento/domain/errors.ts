export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class HorarioIndisponivelError extends Error {
  readonly nome = "HorarioIndisponivelError" as const;

  constructor(
    readonly profissionalId: string,
    readonly dataHoraInicio: Date,
  ) {
    super("Horário indisponível para o profissional.");
    this.name = this.nome;
  }
}

export class SobreposicaoHorarioError extends Error {
  readonly nome = "SobreposicaoHorarioError" as const;

  constructor(
    readonly profissionalId: string,
    readonly dataHoraInicio: Date,
    readonly dataHoraFim: Date,
  ) {
    super("Já existe agendamento sobreposto para este profissional.");
    this.name = this.nome;
  }
}

export class DuracaoInvalidaError extends Error {
  readonly nome = "DuracaoInvalidaError" as const;

  constructor(readonly duracaoMinutos: number) {
    super(
      "Duração inválida: deve ter entre 15 e 240 minutos e ser múltiplo de 15.",
    );
    this.name = this.nome;
  }
}

export class AgendamentoNaoEncontradoError extends Error {
  readonly nome = "AgendamentoNaoEncontradoError" as const;

  constructor(readonly agendamentoId: string) {
    super("Agendamento não encontrado nesta clínica.");
    this.name = this.nome;
  }
}

export class TransicaoStatusInvalidaError extends Error {
  readonly nome = "TransicaoStatusInvalidaError" as const;

  constructor(
    readonly statusAtual: string,
    readonly statusAlvo: string,
  ) {
    super(
      `Não é possível alterar status de "${statusAtual}" para "${statusAlvo}".`,
    );
    this.name = this.nome;
  }
}

export class ProcedimentoNaoEncontradoError extends Error {
  readonly nome = "ProcedimentoNaoEncontradoError" as const;

  constructor(readonly procedimentoId: string) {
    super("Procedimento não encontrado nesta clínica.");
    this.name = this.nome;
  }
}

export class JanelaDisponibilidadeInvalidaError extends Error {
  readonly nome = "JanelaDisponibilidadeInvalidaError" as const;

  constructor(readonly mensagem: string) {
    super(mensagem);
    this.name = this.nome;
  }
}

export class ForaDaDisponibilidadeError extends Error {
  readonly nome = "ForaDaDisponibilidadeError" as const;

  constructor(
    readonly profissionalId: string,
    readonly dataHoraInicio: Date,
    readonly dataHoraFim: Date,
  ) {
    super("Intervalo fora das janelas de disponibilidade do profissional.");
    this.name = this.nome;
  }
}
