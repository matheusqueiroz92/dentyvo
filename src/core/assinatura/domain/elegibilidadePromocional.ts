import {
  PRECO_PROMOCIONAL_CENTAVOS,
  type CodigoPlanoPromocional,
} from "./constants";
import type { Plano } from "./Plano";

/**
 * Resolve se o plano é elegível à promoção de lançamento (spec 012, D2).
 * Full e demais planos sem preço promocional → `null` (não consomem vaga).
 *
 * Identificação por nome normalizado ("Básico" / "Médio") ou id estável
 * (`plano-basico`, `basico`, sufixo `-basico`, etc.).
 */
export function resolverCodigoPlanoPromocional(
  plano: Plano,
): CodigoPlanoPromocional | null {
  const nome = normalizarChavePlano(plano.nome);
  if (nome === "basico") return "basico";
  if (nome === "medio") return "medio";

  const id = normalizarChavePlano(plano.id);
  if (id === "basico" || id === "plano-basico" || id.endsWith("-basico")) {
    return "basico";
  }
  if (id === "medio" || id === "plano-medio" || id.endsWith("-medio")) {
    return "medio";
  }

  return null;
}

export function planoElegivelParaPromocao(plano: Plano): boolean {
  return resolverCodigoPlanoPromocional(plano) != null;
}

/** Centavos do override promocional, ou `null` se o plano não for elegível. */
export function precoPromocionalCentavosParaPlano(
  plano: Plano,
): number | null {
  const codigo = resolverCodigoPlanoPromocional(plano);
  if (codigo == null) return null;
  return PRECO_PROMOCIONAL_CENTAVOS[codigo];
}

/** Converte `Plano.valorMensal` (reais) para centavos inteiros. */
export function valorMensalPlanoEmCentavos(plano: Plano): number {
  return Math.round(plano.valorMensal * 100);
}

function normalizarChavePlano(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}
