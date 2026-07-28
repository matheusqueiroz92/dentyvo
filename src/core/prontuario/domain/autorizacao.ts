import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/** Ações da matriz de permissões do módulo prontuário (spec 003). */
export const ACOES_PRONTUARIO = [
  "consultar_prontuario",
  "criar_prontuario",
  "registrar_evolucao",
  "retificar_evolucao",
  "obter_evolucoes",
] as const;

export type AcaoProntuario = (typeof ACOES_PRONTUARIO)[number];

const MATRIZ: Record<AcaoProntuario, readonly Papel[]> = {
  consultar_prontuario: ["admin", "dentista"],
  criar_prontuario: ["admin", "dentista"],
  registrar_evolucao: ["admin", "dentista"],
  retificar_evolucao: ["admin", "dentista"],
  obter_evolucoes: ["admin", "dentista"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
