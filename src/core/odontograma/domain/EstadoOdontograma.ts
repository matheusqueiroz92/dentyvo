/**
 * Catálogo de estados do odontograma (spec 004) — duas categorias.
 * Enum extensível: novos valores entram na categoria correta sem quebrar o modelo.
 */

/** Estados aplicáveis a uma face (`nivel = face`); coexistem entre faces. */
export const ESTADOS_POR_FACE = [
  "higido",
  "cariado",
  "restaurado",
  "fraturado",
  "selante",
] as const;

/**
 * Estados do dente como um todo (`nivel = dente`).
 * Mutuamente exclusivos entre si enquanto vigentes; limpam faces vigentes.
 */
export const ESTADOS_DENTE_INTEIRO = [
  "ausente_extraido",
  "implante",
  "indicado_extracao",
  "protese_coroa",
  "tratamento_endodontico",
] as const;

export const ESTADOS_ODONTOGRAMA = [
  ...ESTADOS_POR_FACE,
  ...ESTADOS_DENTE_INTEIRO,
] as const;

export type EstadoPorFace = (typeof ESTADOS_POR_FACE)[number];
export type EstadoDenteInteiro = (typeof ESTADOS_DENTE_INTEIRO)[number];
export type EstadoOdontograma = (typeof ESTADOS_ODONTOGRAMA)[number];

/** @deprecated Preferir `ehEstadoDenteInteiro`; mantido para UI/legado. */
export const ESTADO_AUSENTE: EstadoDenteInteiro = "ausente_extraido";

export function ehEstadoOdontograma(valor: string): valor is EstadoOdontograma {
  return (ESTADOS_ODONTOGRAMA as readonly string[]).includes(valor);
}

export function ehEstadoPorFace(estado: EstadoOdontograma): estado is EstadoPorFace {
  return (ESTADOS_POR_FACE as readonly string[]).includes(estado);
}

export function ehEstadoDenteInteiro(
  estado: EstadoOdontograma,
): estado is EstadoDenteInteiro {
  return (ESTADOS_DENTE_INTEIRO as readonly string[]).includes(estado);
}

export function ehEstadoAusente(estado: EstadoOdontograma): boolean {
  return estado === ESTADO_AUSENTE;
}
