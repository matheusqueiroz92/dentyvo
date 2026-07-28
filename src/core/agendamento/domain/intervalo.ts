/**
 * Sobreposição half-open `[inicio, fim)` (spec 002).
 * Contíguos (fimA === inicioB) NÃO se sobrepõem.
 */
export function intervalosSobrepoem(
  aInicio: Date,
  aFim: Date,
  bInicio: Date,
  bFim: Date,
): boolean {
  return aInicio.getTime() < bFim.getTime() && bInicio.getTime() < aFim.getTime();
}
