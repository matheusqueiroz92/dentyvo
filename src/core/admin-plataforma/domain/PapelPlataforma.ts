export const PAPEIS_PLATAFORMA = ["super-admin"] as const;

export type PapelPlataforma = (typeof PAPEIS_PLATAFORMA)[number];

export function isPapelPlataforma(value: string): value is PapelPlataforma {
  return (PAPEIS_PLATAFORMA as readonly string[]).includes(value);
}

export function assertPapelPlataforma(value: string): PapelPlataforma {
  if (!isPapelPlataforma(value)) {
    throw new PapelPlataformaInvalidoError(value);
  }
  return value;
}

export class PapelPlataformaInvalidoError extends Error {
  readonly nome = "PapelPlataformaInvalidoError" as const;

  constructor(readonly valor: string) {
    super(
      `Papel de plataforma inválido: "${valor}". Esperado: super-admin.`,
    );
    this.name = this.nome;
  }
}
