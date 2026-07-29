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

/** Limite global de vagas da promoção de lançamento (spec 012, D3). */
export const LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO = 30;

/** Duração do benefício promocional em meses corridos (spec 012, D8). */
export const DURACAO_PROMOCAO_LANCAMENTO_MESES = 12;

/**
 * Antecedência do único aviso de aumento de preço, em dias corridos
 * antes de `precoPromocionalAte` (spec 012, D4).
 */
export const ANTECEDENCIA_AVISO_AUMENTO_PRECO_DIAS = 30;

/**
 * Preços promocionais em centavos (spec 012, T1 / D9).
 * Full e demais planos sem entrada aqui não são elegíveis (D2).
 */
export const PRECO_PROMOCIONAL_CENTAVOS = {
  basico: 5900,
  medio: 9900,
} as const;

export type CodigoPlanoPromocional = keyof typeof PRECO_PROMOCIONAL_CENTAVOS;

/**
 * Máximo de retries do `INSERT … SELECT` sob `unique_violation` de `posicao`
 * (spec 012, D3) — uma tentativa por posição possível.
 */
export const MAX_RETRIES_RESERVA_VAGA_POSICAO =
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO;
