export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class PacienteNaoEncontradoError extends Error {
  readonly nome = "PacienteNaoEncontradoError" as const;

  constructor(readonly pacienteId: string) {
    super("Paciente não encontrado nesta clínica.");
    this.name = this.nome;
  }
}

export class CpfInvalidoError extends Error {
  readonly nome = "CpfInvalidoError" as const;

  constructor(readonly valorInformado: string) {
    super("CPF do paciente inválido.");
    this.name = this.nome;
  }
}
