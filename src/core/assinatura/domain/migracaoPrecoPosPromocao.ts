import type { Assinatura } from "./Assinatura";

/**
 * Candidata à migração de preço: tem cópia promocional, já passou
 * `precoPromocionalAte` e ainda não foi migrada no gateway.
 */
export function assinaturaPendenteDeMigracaoPrecoCheio(
  assinatura: Assinatura,
  agora: Date = new Date(),
): boolean {
  if (!assinatura.temCopiaPromocional()) return false;
  if (assinatura.jaMigradaParaPrecoCheio()) return false;
  if (assinatura.precoPromocionalAte == null) return false;
  return agora.getTime() >= assinatura.precoPromocionalAte.getTime();
}
