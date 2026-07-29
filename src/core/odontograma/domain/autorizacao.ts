import type { Papel } from "@/core/auth/domain/Papel";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

/** Ações da matriz de permissões do módulo odontograma (spec 004 / RBAC 003). */
export const ACOES_ODONTOGRAMA = [
  "registrar_eventos_odontograma",
  "consultar_odontograma_vigente",
  "listar_historico_odontograma",
] as const;

export type AcaoOdontograma = (typeof ACOES_ODONTOGRAMA)[number];

const MATRIZ: Record<AcaoOdontograma, readonly Papel[]> = {
  registrar_eventos_odontograma: ["admin", "dentista"],
  consultar_odontograma_vigente: ["admin", "dentista"],
  listar_historico_odontograma: ["admin", "dentista"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
