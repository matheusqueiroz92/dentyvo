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
 * Reaproveitamos `PermissaoNegadaError` e `DadosInvalidosError` de
 * `shared/errors`.
 */
export const ACOES_ADMIN_PLATAFORMA = [
  "listar_clinicas",
  "criar_clinica",
  "editar_clinica",
  "desativar_clinica",
  "listar_usuarios_clinica",
  "remover_usuario",
  "revogar_sessoes_usuario",
  "trocar_papel_usuario",
  /** Próxima iteração (spec 009) — assinatura existe; não implementar no MVP. */
  "resetar_senha_usuario",
] as const;

export type AcaoAdminPlataforma = (typeof ACOES_ADMIN_PLATAFORMA)[number];

export function pode(
  usuario: UsuarioPlataforma,
  acao: AcaoAdminPlataforma,
): boolean {
  void acao;
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
