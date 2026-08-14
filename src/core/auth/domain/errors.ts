export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class DocumentoFiscalInvalidoError extends Error {
  readonly nome = "DocumentoFiscalInvalidoError" as const;

  constructor(
    readonly tipo: string,
    readonly valorInformado: string,
  ) {
    super(`Documento fiscal ${tipo} inválido.`);
    this.name = this.nome;
  }
}

export class ConviteExpiradoError extends Error {
  readonly nome = "ConviteExpiradoError" as const;

  constructor(readonly conviteId: string) {
    super("Convite expirado.");
    this.name = this.nome;
  }
}

export class ConviteJaAceitoError extends Error {
  readonly nome = "ConviteJaAceitoError" as const;

  constructor(readonly conviteId: string) {
    super("Convite já foi utilizado.");
    this.name = this.nome;
  }
}

export class UsuarioJaVinculadoAClinicaError extends Error {
  readonly nome = "UsuarioJaVinculadoAClinicaError" as const;

  constructor(readonly email: string) {
    super("Este e-mail já está vinculado a uma clínica.");
    this.name = this.nome;
  }
}

export class DocumentoClinicaDuplicadoError extends Error {
  readonly nome = "DocumentoClinicaDuplicadoError" as const;

  constructor(readonly documentoValor: string) {
    super("Já existe uma clínica com este documento fiscal.");
    this.name = this.nome;
  }
}

export class ClinicaNaoEncontradaError extends Error {
  readonly nome = "ClinicaNaoEncontradaError" as const;

  constructor(readonly clinicaId: string) {
    super("Clínica não encontrada.");
    this.name = this.nome;
  }
}

export class ProfissionalNaoEncontradoError extends Error {
  readonly nome = "ProfissionalNaoEncontradoError" as const;

  constructor(readonly profissionalId: string) {
    super("Profissional não encontrado nesta clínica.");
    this.name = this.nome;
  }
}

export class CroObrigatorioError extends Error {
  readonly nome = "CroObrigatorioError" as const;

  constructor() {
    super("CRO é obrigatório para o papel dentista.");
    this.name = this.nome;
  }
}

export class ConviteNaoEncontradoError extends Error {
  readonly nome = "ConviteNaoEncontradoError" as const;

  constructor() {
    super("Convite não encontrado.");
    this.name = this.nome;
  }
}

/**
 * Tentativa de atualizar o perfil de outro usuário (spec 001 —
 * emenda Perfil próprio). Autorização por identidade, não por papel.
 */
export class PerfilProprioNaoAutorizadoError extends Error {
  readonly nome = "PerfilProprioNaoAutorizadoError" as const;

  constructor(
    readonly usuarioIdAlvo: string,
    readonly usuarioIdAtor: string,
  ) {
    super("Só é possível atualizar o próprio nome.");
    this.name = this.nome;
  }
}

/**
 * As duas escritas de nome (BetterAuth `user.name` e `Profissional.nome`)
 * ficaram divergentes e a compensação da primeira também falhou.
 * Retry do mesmo comando reconcilia. Ver decisão no caso de uso
 * `AtualizarPerfilProprio`.
 */
export class PerfilProprioDessincronizadoError extends Error {
  readonly nome = "PerfilProprioDessincronizadoError" as const;

  constructor(readonly usuarioId: string) {
    super(
      "O nome da conta e o nome do profissional ficaram dessincronizados. Tente novamente.",
    );
    this.name = this.nome;
  }
}
