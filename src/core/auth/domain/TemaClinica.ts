import { DadosInvalidosError } from "@/core/shared/errors";

/**
 * Temas visuais pré-definidos da clínica (personalização de marca).
 * Paletas concretas na UI devem respeitar contraste WCAG 2.2 AA
 * (`docs/DESIGN_SYSTEM.md`).
 */
export const TEMAS_CLINICA = [
  "azul-padrao",
  "verde",
  "roxo",
  "grafite",
] as const;

export type TemaClinica = (typeof TEMAS_CLINICA)[number];

export function isTemaClinica(value: string): value is TemaClinica {
  return (TEMAS_CLINICA as readonly string[]).includes(value);
}

export function assertTemaClinica(value: string): TemaClinica {
  if (!isTemaClinica(value)) {
    throw new DadosInvalidosError(
      `Tema de clínica inválido: "${value}". Esperado: ${TEMAS_CLINICA.join(" | ")}.`,
    );
  }
  return value;
}
