import { calcularIdade } from "@/lib/pacientes/formatacao";

/** Idade a partir da qual a dentição decídua fica oculta por padrão. */
export const IDADE_OCULTAR_DECIDUA = 13;

/** Mesma regra do odontograma: &lt; 13 mostra decídua; ≥ 13 oculta. */
export function deciduaVisivelPorPadrao(
  dataNascimentoIso: string,
  referencia: Date = new Date(),
): boolean {
  return calcularIdade(dataNascimentoIso, referencia) < IDADE_OCULTAR_DECIDUA;
}
