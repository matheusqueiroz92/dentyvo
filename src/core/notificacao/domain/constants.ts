/** Janela de deduplicação (spec 011): 1 hora. */
export const JANELA_DEDUP_MS = 60 * 60 * 1000;

/**
 * Bucket discreto da janela de dedup (para constraint de banco no adapter).
 * Mesmo `tipo` + destinatário + `chaveNegocio` no mesmo bucket = duplicata.
 *
 * Balde **fixo** (não janela deslizante): escolha consciente para UNIQUE
 * atômica. Envios em baldes vizinhos (ex. 12:59 e 13:01) não deduplicam —
 * limitação aceita na spec 011, não bug.
 */
export function calcularJanelaDedup(
  instante: Date,
  janelaMs: number = JANELA_DEDUP_MS,
): number {
  return Math.floor(instante.getTime() / janelaMs);
}
