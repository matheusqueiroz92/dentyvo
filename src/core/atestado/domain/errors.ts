export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export { SnapshotCabecalhoInvalidoError } from "@/core/shared/SnapshotCabecalhoDocumento";

export class AtestadoNaoEncontradoError extends Error {
  readonly nome = "AtestadoNaoEncontradoError" as const;

  constructor(readonly atestadoId: string) {
    super("Atestado não encontrado nesta clínica.");
    this.name = this.nome;
  }
}

export class MotivoAtestadoInvalidoError extends Error {
  readonly nome = "MotivoAtestadoInvalidoError" as const;

  constructor() {
    super("Motivo do atestado é obrigatório.");
    this.name = this.nome;
  }
}

export class CidFormatoInvalidoError extends Error {
  readonly nome = "CidFormatoInvalidoError" as const;

  constructor(readonly valorInformado: string) {
    super(
      "CID inválido: informe um código no formato CID-10 (ex.: K08.1) ou deixe em branco.",
    );
    this.name = this.nome;
  }
}

export class PeriodoAfastamentoInvalidoError extends Error {
  readonly nome = "PeriodoAfastamentoInvalidoError" as const;

  constructor(readonly motivo: string) {
    super(motivo);
    this.name = this.nome;
  }
}

export class CroAusenteNaEmissaoError extends Error {
  readonly nome = "CroAusenteNaEmissaoError" as const;

  constructor() {
    super("CRO do profissional é obrigatório para emitir atestado.");
    this.name = this.nome;
  }
}
