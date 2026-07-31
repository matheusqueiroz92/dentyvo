import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";

import type { Papel } from "./Papel";

/** Ações da matriz de permissões da feature 001. */
export const ACOES_AUTORIZADAS = [
  "convidar_usuario",
  "listar_membros",
  "alterar_papel_membro",
  "remover_membro",
  "revogar_sessoes_membro",
  "editar_clinica",
  "atualizar_logo_clinica",
  "atualizar_tema_clinica",
] as const;

export type AcaoAutorizada = (typeof ACOES_AUTORIZADAS)[number];

const MATRIZ: Record<AcaoAutorizada, readonly Papel[]> = {
  convidar_usuario: ["admin"],
  listar_membros: ["admin", "dentista", "recepcao"],
  alterar_papel_membro: ["admin"],
  remover_membro: ["admin"],
  revogar_sessoes_membro: ["admin"],
  editar_clinica: ["admin"],
  atualizar_logo_clinica: ["admin"],
  atualizar_tema_clinica: ["admin"],
};

/** Helper de domínio (spec 001): checagem de papel pura, sem port. */
export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);
