import { NumeroDenteInvalidoError } from "./errors";

/** Permanentes FDI por quadrante (spec 004). */
const PERMANENTES = [
  11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33,
  34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48,
] as const;

/** Decíduos FDI por quadrante (spec 004). */
const DECIDUOS = [
  51, 52, 53, 54, 55, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 81, 82, 83, 84,
  85,
] as const;

const VALIDOS = new Set<number>([...PERMANENTES, ...DECIDUOS]);

export const NUMEROS_DENTE_PERMANENTES: readonly number[] = PERMANENTES;
export const NUMEROS_DENTE_DECIDUOS: readonly number[] = DECIDUOS;

/**
 * Value object de numeração FDI (permanente 11–48 + decídua 51–85).
 * Dentição mista é permitida no mesmo odontograma.
 */
export class NumeroDente {
  private constructor(readonly valor: number) {}

  static criar(numero: number): NumeroDente {
    if (!Number.isInteger(numero) || !VALIDOS.has(numero)) {
      throw new NumeroDenteInvalidoError(numero);
    }
    return new NumeroDente(numero);
  }

  static ehValido(numero: number): boolean {
    return Number.isInteger(numero) && VALIDOS.has(numero);
  }

  get ehPermanente(): boolean {
    return (PERMANENTES as readonly number[]).includes(this.valor);
  }

  get ehDeciduo(): boolean {
    return (DECIDUOS as readonly number[]).includes(this.valor);
  }

  equals(outro: NumeroDente): boolean {
    return this.valor === outro.valor;
  }
}
