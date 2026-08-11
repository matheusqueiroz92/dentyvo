import { CidFormatoInvalidoError } from "./errors";

/**
 * Formato estrutural CID-10 (spec 006b): uma letra + 2 ou 3 dígitos,
 * com subcategoria opcional de 1 dígito após ponto.
 * Exemplos válidos: `A09`, `K08`, `K08.1`, `K081`.
 * Não valida existência nem adequação clínica do código.
 */
export const CID_10_FORMATO = /^[A-Z]\d{2,3}(?:\.\d)?$/;

/**
 * Código CID opcional do atestado.
 * Ausente / em branco → `null`. Preenchido → trim + maiúsculas + formato.
 */
export class Cid {
  readonly codigo: string;

  private constructor(codigo: string) {
    this.codigo = codigo;
  }

  /**
   * `null`/`undefined`/string vazia (após trim) → `null`.
   * Qualquer outro valor é normalizado e validado.
   */
  static parseOpcional(valor: string | null | undefined): Cid | null {
    if (valor == null) return null;
    const trimmed = valor.trim();
    if (!trimmed) return null;
    return Cid.criar(trimmed);
  }

  static criar(valor: string): Cid {
    const normalizado = valor.trim().toUpperCase();
    if (!CID_10_FORMATO.test(normalizado)) {
      throw new CidFormatoInvalidoError(valor);
    }
    return new Cid(normalizado);
  }

  static reconstituir(codigo: string): Cid {
    return new Cid(codigo);
  }
}
