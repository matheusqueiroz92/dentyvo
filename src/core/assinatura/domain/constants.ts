/** Duração do trial em dias corridos (spec 010, decisão aprovada). */
export const DURACAO_TRIAL_DIAS = 14;

/**
 * Dias corridos após `Cobranca` passar a `vencida` antes de a assinatura
 * tornar-se `inadimplente` (spec 010, decisão aprovada).
 */
export const TOLERANCIA_INADIMPLENCIA_DIAS = 3;

/** Único ciclo suportado no MVP. */
export const CICLO_ASSINATURA_MVP = "mensal" as const;
export type CicloAssinaturaMvp = typeof CICLO_ASSINATURA_MVP;
