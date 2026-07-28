import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/** Ações da matriz de permissões do módulo anamnese (spec 003). */
export const ACOES_ANAMNESE = [
  "escrever_anamnese",
  "listar_versoes_anamnese",
  "obter_versao_vigente_anamnese",
] as const;

export type AcaoAnamnese = (typeof ACOES_ANAMNESE)[number];

const MATRIZ: Record<AcaoAnamnese, readonly Papel[]> = {
  escrever_anamnese: ["admin", "dentista"],
  listar_versoes_anamnese: ["admin", "dentista"],
  obter_versao_vigente_anamnese: ["admin", "dentista"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
