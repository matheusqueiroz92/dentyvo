export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export { NumeroDenteInvalidoError } from "@/core/odontograma/domain/errors";

export class PeriogramaNaoEncontradoError extends Error {
  readonly nome = "PeriogramaNaoEncontradoError" as const;

  constructor(readonly periogramaId: string) {
    super("Periograma não encontrado nesta clínica.");
    this.name = this.nome;
  }
}

/**
 * Grau incompatível com o sistema de classificação de furca
 * (ex.: Hamp + grau 4). Spec 005.
 */
export class GrauForaDoSistemaError extends Error {
  readonly nome = "GrauForaDoSistemaError" as const;

  constructor(
    readonly sistema: string,
    readonly grau: number,
  ) {
    super(
      `Grau de furca ${grau} é inválido para o sistema "${sistema}". Hamp aceita 1–3; Glickman aceita 1–4.`,
    );
    this.name = this.nome;
  }
}

export class SistemaFurcaInvalidoError extends Error {
  readonly nome = "SistemaFurcaInvalidoError" as const;

  constructor(readonly sistema: string) {
    super(
      `Sistema de classificação de furca inválido: "${sistema}". Aceitos: "hamp" | "glickman".`,
    );
    this.name = this.nome;
  }
}

/** Furca só se aplica a dentes multirradiculares (molares). */
export class FurcaNaoAplicavelAoDenteError extends Error {
  readonly nome = "FurcaNaoAplicavelAoDenteError" as const;

  constructor(readonly numeroDente: number) {
    super(
      `Classificação de furca não se aplica ao dente ${numeroDente} (apenas molares / multirradiculares).`,
    );
    this.name = this.nome;
  }
}

export class MobilidadeMillerInvalidaError extends Error {
  readonly nome = "MobilidadeMillerInvalidaError" as const;

  constructor(readonly grau: number) {
    super(
      `Mobilidade Miller inválida: ${grau}. Aceitos: 0, 1, 2 ou 3.`,
    );
    this.name = this.nome;
  }
}

export class LadoSondagemInvalidoError extends Error {
  readonly nome = "LadoSondagemInvalidoError" as const;

  constructor(readonly lado: string) {
    super(
      `Lado de sondagem inválido: "${lado}". Aceitos: "vestibular" | "palatina_lingual".`,
    );
    this.name = this.nome;
  }
}

export class PosicaoSondagemInvalidaError extends Error {
  readonly nome = "PosicaoSondagemInvalidaError" as const;

  constructor(readonly posicao: string) {
    super(
      `Posição de sondagem inválida: "${posicao}". Aceitos: "mesial" | "central" | "distal".`,
    );
    this.name = this.nome;
  }
}

export class PontoSondagemDuplicadoError extends Error {
  readonly nome = "PontoSondagemDuplicadoError" as const;

  constructor(
    readonly lado: string,
    readonly posicao: string,
  ) {
    super(
      `Ponto de sondagem duplicado: lado "${lado}" + posição "${posicao}".`,
    );
    this.name = this.nome;
  }
}

export class PontosSondagemExcedentesError extends Error {
  readonly nome = "PontosSondagemExcedentesError" as const;

  constructor(readonly quantidade: number) {
    super(
      `Dente não pode ter mais de 6 pontos de sondagem (recebido: ${quantidade}).`,
    );
    this.name = this.nome;
  }
}

export class TipoPeriogramaInvalidoError extends Error {
  readonly nome = "TipoPeriogramaInvalidoError" as const;

  constructor(readonly tipo: string) {
    super(
      `Tipo de periograma inválido: "${tipo}". Aceitos: "exame_inicial" | "reavaliacao".`,
    );
    this.name = this.nome;
  }
}

/** Mesmo `numeroDente` não pode aparecer mais de uma vez no mesmo periograma. */
export class DenteDuplicadoNoPeriogramaError extends Error {
  readonly nome = "DenteDuplicadoNoPeriogramaError" as const;

  constructor(readonly numeroDente: number) {
    super(
      `Dente FDI ${numeroDente} está duplicado neste periograma; cada dente pode aparecer no máximo uma vez.`,
    );
    this.name = this.nome;
  }
}
