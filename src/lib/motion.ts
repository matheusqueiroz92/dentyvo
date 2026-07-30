/**
 * Tokens de movimento alinhados ao DESIGN_SYSTEM §12.
 * Durações em segundos (Motion usa s; o design system documenta ms).
 */

/** cubic-bezier(0.2, 0, 0, 1) */
export const MOTION_EASE = [0.2, 0, 0, 1] as const;

export const MOTION_DURATION_MS = {
  /** Microinteração: 120–160 ms */
  micro: 140,
  /** Componente / entrada de seção: 180–220 ms */
  component: 200,
  /** Painel / bloco maior: 240–300 ms */
  panel: 280,
} as const;

export const MOTION_DURATION_S = {
  micro: MOTION_DURATION_MS.micro / 1000,
  component: MOTION_DURATION_MS.component / 1000,
  panel: MOTION_DURATION_MS.panel / 1000,
} as const;

/** Translação vertical tipica de entrada ao rolar (16–24 px). */
export const MOTION_REVEAL_Y = 20;
