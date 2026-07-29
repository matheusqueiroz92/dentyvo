export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class AssinaturaNaoEncontradaError extends Error {
  readonly nome = "AssinaturaNaoEncontradaError" as const;

  constructor(readonly clinicaId: string) {
    super("Assinatura não encontrada para esta clínica.");
    this.name = this.nome;
  }
}

export class PlanoNaoEncontradoError extends Error {
  readonly nome = "PlanoNaoEncontradoError" as const;

  constructor(readonly planoId: string) {
    super("Plano não encontrado.");
    this.name = this.nome;
  }
}

export class AssinaturaJaExisteError extends Error {
  readonly nome = "AssinaturaJaExisteError" as const;

  constructor(readonly clinicaId: string) {
    super("Clínica já possui assinatura (trial ou paga).");
    this.name = this.nome;
  }
}

export class MetodoPagamentoNaoSuportadoError extends Error {
  readonly nome = "MetodoPagamentoNaoSuportadoError" as const;

  constructor(readonly metodo: string) {
    super(
      `Método de pagamento "${metodo}" não é suportado no MVP (apenas pix e boleto).`,
    );
    this.name = this.nome;
  }
}

export class TransicaoStatusAssinaturaInvalidaError extends Error {
  readonly nome = "TransicaoStatusAssinaturaInvalidaError" as const;

  constructor(
    readonly de: string,
    readonly para: string,
  ) {
    super(`Transição de status de assinatura inválida: ${de} → ${para}.`);
    this.name = this.nome;
  }
}

export class TransicaoStatusCobrancaInvalidaError extends Error {
  readonly nome = "TransicaoStatusCobrancaInvalidaError" as const;

  constructor(
    readonly de: string,
    readonly para: string,
  ) {
    super(`Transição de status de cobrança inválida: ${de} → ${para}.`);
    this.name = this.nome;
  }
}

export class CobrancaNaoEncontradaError extends Error {
  readonly nome = "CobrancaNaoEncontradaError" as const;

  constructor(readonly gatewayCobrancaId: string) {
    super("Cobrança não encontrada.");
    this.name = this.nome;
  }
}

/** Cupom de lançamento esgotado (30 vagas) — spec 012, D3. */
export class VagasPromocionaisEsgotadasError extends Error {
  readonly nome = "VagasPromocionaisEsgotadasError" as const;

  constructor() {
    super("Vagas da promoção de lançamento esgotadas.");
    this.name = this.nome;
  }
}

/**
 * Tentativa de alterar a cópia promocional na Assinatura de forma
 * independente / divergente da `VagaPromocional` (spec 012, D6).
 */
export class CopiaPromocionalDivergenteError extends Error {
  readonly nome = "CopiaPromocionalDivergenteError" as const;

  constructor(readonly assinaturaId: string) {
    super(
      "Cópia promocional na assinatura diverge da vaga (fonte de verdade).",
    );
    this.name = this.nome;
  }
}

/** Plano sem preço promocional (ex.: Full) — spec 012, D2. */
export class PlanoNaoElegivelParaPromocaoError extends Error {
  readonly nome = "PlanoNaoElegivelParaPromocaoError" as const;

  constructor(readonly planoId: string) {
    super("Plano não é elegível à promoção de lançamento.");
    this.name = this.nome;
  }
}
