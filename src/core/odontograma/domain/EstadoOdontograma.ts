/**
 * Catálogo inicial de estados do odontograma (spec 004).
 * Enum extensível: novos valores podem ser acrescentados sem quebrar o modelo.
 */
export const ESTADOS_ODONTOGRAMA = [
  "higido",
  "cariado",
  "restaurado",
  "ausente_extraido",
  "indicado_extracao",
  "protese_coroa",
  "implante",
  "fraturado",
  "tratamento_endodontico",
  "selante",
] as const;

export type EstadoOdontograma = (typeof ESTADOS_ODONTOGRAMA)[number];

/** Estado exclusivo do nível do dente (não replicado por face). */
export const ESTADO_AUSENTE: EstadoOdontograma = "ausente_extraido";

export function ehEstadoOdontograma(valor: string): valor is EstadoOdontograma {
  return (ESTADOS_ODONTOGRAMA as readonly string[]).includes(valor);
}

export function ehEstadoAusente(estado: EstadoOdontograma): boolean {
  return estado === ESTADO_AUSENTE;
}
