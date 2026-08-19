export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class ContaWhatsappNaoEncontradaError extends Error {
  readonly nome = "ContaWhatsappNaoEncontradaError" as const;

  constructor(readonly clinicaId: string) {
    super("Conta WhatsApp não encontrada para esta clínica.");
    this.name = this.nome;
  }
}

export class CodigoOAuthInvalidoError extends Error {
  readonly nome = "CodigoOAuthInvalidoError" as const;

  constructor() {
    super("Código OAuth inválido ou expirado; a conexão não foi concluída.");
    this.name = this.nome;
  }
}

export class WhatsappNaoConectadoError extends Error {
  readonly nome = "WhatsappNaoConectadoError" as const;

  constructor(readonly clinicaId: string) {
    super(
      "WhatsApp da clínica não está conectado; envio de mensagens bloqueado.",
    );
    this.name = this.nome;
  }
}

export class TokenWhatsappInvalidoError extends Error {
  readonly nome = "TokenWhatsappInvalidoError" as const;

  constructor(readonly clinicaId: string) {
    super("Token WhatsApp inválido, expirado ou revogado.");
    this.name = this.nome;
  }
}

export class MultiplosNumerosNoWabaNaoSuportadoError extends Error {
  readonly nome = "MultiplosNumerosNoWabaNaoSuportadoError" as const;

  constructor(
    readonly wabaId: string,
    readonly quantidade: number,
  ) {
    super(
      "A conta WhatsApp Business conectada tem mais de um número. A clínica precisa deixar apenas um número associado a essa conta no Meta Business Manager e tentar conectar de novo.",
    );
    this.name = this.nome;
  }
}
