export const PAPEIS = ["admin", "dentista", "recepcao"] as const;

export type Papel = (typeof PAPEIS)[number];

export function isPapel(value: string): value is Papel {
  return (PAPEIS as readonly string[]).includes(value);
}

export function assertPapel(value: string): Papel {
  if (!isPapel(value)) {
    throw new PapelInvalidoError(value);
  }
  return value;
}

export class PapelInvalidoError extends Error {
  readonly nome = "PapelInvalidoError" as const;

  constructor(readonly valor: string) {
    super(`Papel inválido: "${valor}". Esperado: admin | dentista | recepcao.`);
    this.name = this.nome;
  }
}
