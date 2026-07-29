import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/** Ações da matriz de permissões do módulo periograma (spec 005 / RBAC 003). */
export const ACOES_PERIOGRAMA = [
  "registrar_periograma",
  "consultar_periograma",
  "listar_periogramas_prontuario",
] as const;

export type AcaoPeriograma = (typeof ACOES_PERIOGRAMA)[number];

const MATRIZ: Record<AcaoPeriograma, readonly Papel[]> = {
  registrar_periograma: ["admin", "dentista"],
  consultar_periograma: ["admin", "dentista"],
  listar_periogramas_prontuario: ["admin", "dentista"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
