import { DadosInvalidosError } from "./errors";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;

/**
 * Identificador público URL-safe (clínica globalmente; profissional por tenant).
 * Formato: minúsculas, dígitos e hífens — sem espaços, acentos ou caracteres especiais.
 */
export class Slug {
  readonly valor: string;

  private constructor(valor: string) {
    this.valor = valor;
  }

  static criar(bruto: string): Slug {
    const normalizado = bruto.trim().toLowerCase();
    if (!normalizado) {
      throw new DadosInvalidosError("Slug é obrigatório.");
    }
    if (normalizado.length > MAX_SLUG_LENGTH) {
      throw new DadosInvalidosError(
        `Slug deve ter no máximo ${MAX_SLUG_LENGTH} caracteres.`,
      );
    }
    if (!SLUG_REGEX.test(normalizado)) {
      throw new DadosInvalidosError(
        "Slug inválido: use apenas letras minúsculas, números e hífens.",
      );
    }
    return new Slug(normalizado);
  }

  /** Deriva slug a partir de nome legível (cadastro / fallback pré-migração). */
  static criarAPartirDoNome(nome: string): Slug {
    const base = nome
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");

    if (!base) {
      throw new DadosInvalidosError(
        "Não foi possível gerar slug a partir do nome informado.",
      );
    }

    return Slug.criar(base.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, ""));
  }

  equals(outro: Slug): boolean {
    return this.valor === outro.valor;
  }
}
