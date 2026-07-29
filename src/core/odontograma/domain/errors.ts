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

/** Invariante: dente ausente não recebe eventos de face. */
export class DenteAusenteSemFacesError extends Error {
  readonly nome = "DenteAusenteSemFacesError" as const;

  constructor(readonly numeroDente: number) {
    super(
      `Dente ${numeroDente} está ausente/extraído; não é permitido registrar estado de face.`,
    );
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
