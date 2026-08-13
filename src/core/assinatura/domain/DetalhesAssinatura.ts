import type { Cobranca } from "./Cobranca";
import { LIMITE_HISTORICO_COBRANCA_PAINEL } from "./constants";
import type { MetodoPagamento } from "./MetodoPagamento";
import type { StatusAssinatura } from "./StatusAssinatura";
import type { StatusCobranca } from "./StatusCobranca";

/**
 * Origem do valor efetivo no painel (mesmo vocabulário de
 * `ResolverValorCobrancaAssinatura`). `null` no trial sem plano.
 */
export type OrigemValorDetalhesAssinatura = "promocional" | "cheio";

export type ItemHistoricoCobranca = {
  id: string;
  valor: number;
  metodo: MetodoPagamento;
  status: StatusCobranca;
  vencimento: Date;
  pagaEm: Date | null;
  linkPagamento: string | null;
};

/**
 * Read-model do painel da clínica (spec 010 + 012 — `ObterDetalhesAssinatura`).
 * Não é entidade persistida; montado só a partir de dado já gravado.
 */
export type DetalhesAssinatura = {
  plano: { nome: string; valorMensal: number } | null;
  status: StatusAssinatura;
  dataProximaCobranca: Date | null;
  historicoCobranca: ItemHistoricoCobranca[];
  precoPromocionalAte: Date | null;
  migradaParaPrecoCheioEm: Date | null;
  /**
   * Valor vigente em centavos. `null` no trial sem `planoId` (P6/P8).
   */
  valorEfetivoCentavos: number | null;
  origemValor: OrigemValorDetalhesAssinatura | null;
  vagaPromocional: { posicao: number } | null;
  linkRegularizacao: string | null;
};

const STATUS_REGULARIZAVEIS: ReadonlySet<StatusCobranca> = new Set([
  "pendente",
  "vencida",
]);

/** Ordena por `vencimento` desc e limita ao histórico do painel (P5). */
export function selecionarCobrancasRecentes(
  cobrancas: readonly Cobranca[],
  limite: number = LIMITE_HISTORICO_COBRANCA_PAINEL,
): Cobranca[] {
  return [...cobrancas]
    .sort((a, b) => b.vencimento.getTime() - a.vencimento.getTime())
    .slice(0, limite);
}

export function paraItemHistoricoCobranca(
  cobranca: Cobranca,
): ItemHistoricoCobranca {
  return {
    id: cobranca.id,
    valor: cobranca.valor,
    metodo: cobranca.metodo,
    status: cobranca.status,
    vencimento: cobranca.vencimento,
    pagaEm: cobranca.pagaEm,
    linkPagamento: cobranca.linkPagamento,
  };
}

export function montarHistoricoCobranca(
  cobrancas: readonly Cobranca[],
): ItemHistoricoCobranca[] {
  return selecionarCobrancasRecentes(cobrancas).map(paraItemHistoricoCobranca);
}

/**
 * `linkPagamento` da cobrança `pendente` ou `vencida` mais recente por
 * vencimento (P9). Não muta cobrança.
 */
export function resolverLinkRegularizacao(
  cobrancas: readonly Cobranca[],
): string | null {
  const elegiveis = cobrancas.filter((c) => STATUS_REGULARIZAVEIS.has(c.status));
  const maisRecente = selecionarCobrancasRecentes(elegiveis, 1)[0];
  return maisRecente?.linkPagamento ?? null;
}
