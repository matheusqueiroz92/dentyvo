export {
  DadosInvalidosError,
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

export class NumeroDenteInvalidoError extends Error {
  readonly nome = "NumeroDenteInvalidoError" as const;

  constructor(readonly numeroDente: number) {
    super(
      `Número de dente FDI inválido: ${numeroDente}. Aceitos: permanentes 11–18, 21–28, 31–38, 41–48 e decíduos 51–55, 61–65, 71–75, 81–85.`,
    );
    this.name = this.nome;
  }
}

export class EstadoOdontogramaInvalidoError extends Error {
  readonly nome = "EstadoOdontogramaInvalidoError" as const;

  constructor(readonly estado: string) {
    super(`Estado de odontograma inválido: "${estado}".`);
    this.name = this.nome;
  }
}

/** Estado da categoria errada para o `nivel` do evento (spec 004). */
export class EstadoIncompativelComNivelError extends Error {
  readonly nome = "EstadoIncompativelComNivelError" as const;

  constructor(
    readonly estado: string,
    readonly nivel: "face" | "dente",
  ) {
    super(
      nivel === "face"
        ? `Estado "${estado}" é de dente inteiro; não pode ser registrado em nivel=face.`
        : `Estado "${estado}" é por face; não pode ser registrado em nivel=dente.`,
    );
    this.name = this.nome;
  }
}

/**
 * Dois estados de dente inteiro diferentes no mesmo dente
 * (lote atual e/ou vigente persistido) — sem sobrescrita silenciosa.
 */
export class EstadoDenteInteiroConflitanteError extends Error {
  readonly nome = "EstadoDenteInteiroConflitanteError" as const;

  constructor(
    readonly numeroDente: number,
    readonly estadoVigente: string,
    readonly estadoNovo: string,
  ) {
    super(
      `Dente ${numeroDente} já tem estado de dente inteiro vigente "${estadoVigente}"; não é permitido registrar "${estadoNovo}" sem encerrar o anterior via evento de face.`,
    );
    this.name = this.nome;
  }
}

export class FaceOdontogramaInvalidaError extends Error {
  readonly nome = "FaceOdontogramaInvalidaError" as const;

  constructor(readonly face: string) {
    super(`Face de odontograma inválida: "${face}".`);
    this.name = this.nome;
  }
}

export class EventoOdontogramaInvalidoError extends Error {
  readonly nome = "EventoOdontogramaInvalidoError" as const;

  constructor(readonly mensagem: string) {
    super(mensagem);
    this.name = this.nome;
  }
}

export class NenhumEventoOdontogramaError extends Error {
  readonly nome = "NenhumEventoOdontogramaError" as const;

  constructor() {
    super("É necessário informar ao menos um evento de odontograma.");
    this.name = this.nome;
  }
}
