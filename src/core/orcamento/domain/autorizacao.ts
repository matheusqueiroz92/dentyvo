import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/**
 * Ações da matriz de permissões do módulo orçamento (spec 015).
 * Diferente de Receita/Atestado: admin + dentista + recepção.
 */
export const ACOES_ORCAMENTO = [
  "emitir_orcamento",
  "listar_orcamentos_prontuario",
  "aceitar_orcamento",
  "recusar_orcamento",
  "gerar_pdf_orcamento",
] as const;

export type AcaoOrcamento = (typeof ACOES_ORCAMENTO)[number];

const PAPEIS_COMERCIAIS = ["admin", "dentista", "recepcao"] as const satisfies readonly Papel[];

const MATRIZ: Record<AcaoOrcamento, readonly Papel[]> = {
  emitir_orcamento: PAPEIS_COMERCIAIS,
  listar_orcamentos_prontuario: PAPEIS_COMERCIAIS,
  aceitar_orcamento: PAPEIS_COMERCIAIS,
  recusar_orcamento: PAPEIS_COMERCIAIS,
  gerar_pdf_orcamento: PAPEIS_COMERCIAIS,
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
