import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/** Ações da matriz de permissões do módulo receituário (spec 006). */
export const ACOES_RECEITUARIO = [
  "emitir_receita",
  "listar_receitas_prontuario",
  "gerar_pdf_receita",
] as const;

export type AcaoReceituario = (typeof ACOES_RECEITUARIO)[number];

const MATRIZ: Record<AcaoReceituario, readonly Papel[]> = {
  emitir_receita: ["dentista"],
  listar_receitas_prontuario: ["dentista"],
  gerar_pdf_receita: ["dentista"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
