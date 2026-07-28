import { PermissaoNegadaError } from "@/core/shared/errors";

import type { UsuarioPlataforma } from "./UsuarioPlataforma";

/**
 * Ações do painel administrativo da plataforma (spec 009).
 *
 * Por que NÃO reutilizamos `criarVerificadorAutorizacao`:
 * - A factory compartilhada tipa a matriz em `Papel` de clínica
 *   (`admin` | `dentista` | `recepcao`) — dimensão errada para este módulo.
 * - `UsuarioPlataforma` não tem `clinicaId`; a checagem é binária
 *   (é ou não é super-admin), não uma matriz RBAC intra-tenant.
 * - No MVP só existe `super-admin` (spec: fora de escopo múltiplos níveis);
 *   uma `Record<Acao, ["super-admin"]>` seria cerimônia sem ganho.
 *
 * Reaproveitamos apenas `PermissaoNegadaError` de `shared/errors`.
 */
export const ACOES_ADMIN_PLATAFORMA = [
  "listar_clinicas",
  "criar_clinica",
  "editar_clinica",
  "desativar_clinica",
  "listar_usuarios_clinica",
  "remover_usuario",
] as const;

export type AcaoAdminPlataforma = (typeof ACOES_ADMIN_PLATAFORMA)[number];

export function pode(
  usuario: UsuarioPlataforma,
  _acao: AcaoAdminPlataforma,
): boolean {
  return usuario.papel === "super-admin";
}

export function assertPode(
  usuario: UsuarioPlataforma,
  acao: AcaoAdminPlataforma,
): void {
  if (!pode(usuario, acao)) {
    throw new PermissaoNegadaError(usuario.papel, acao);
  }
}
