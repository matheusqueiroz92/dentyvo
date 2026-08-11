import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/** Ações da matriz de permissões do módulo atestado (spec 006b — igual à 006). */
export const ACOES_ATESTADO = [
  "emitir_atestado",
  "listar_atestados_prontuario",
  "gerar_pdf_atestado",
] as const;

export type AcaoAtestado = (typeof ACOES_ATESTADO)[number];

const MATRIZ: Record<AcaoAtestado, readonly Papel[]> = {
  emitir_atestado: ["dentista"],
  listar_atestados_prontuario: ["dentista"],
  gerar_pdf_atestado: ["dentista"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
