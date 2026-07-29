import type { Papel } from "@/core/auth/domain/Papel";
import type { UsuarioPlataforma } from "@/core/admin-plataforma/domain/UsuarioPlataforma";
import { criarVerificadorAutorizacao } from "@/core/shared/autorizacao";
import { PermissaoNegadaError } from "@/core/shared/errors";

/**
 * Ações intra-tenant do módulo de assinatura (spec 010).
 * Só `admin` da clínica cria assinatura paga.
 *
 * `IniciarTrial` é orquestrado por `src/actions` (sem RBAC de clínica).
 * `ProcessarWebhookPagamento` e `VerificarAcessoAtivo` são de sistema.
 * `ConcederAcessoManual` usa checagem de plataforma (abaixo).
 */
export const ACOES_ASSINATURA = ["criar_assinatura"] as const;

export type AcaoAssinatura = (typeof ACOES_ASSINATURA)[number];

const MATRIZ: Record<AcaoAssinatura, readonly Papel[]> = {
  criar_assinatura: ["admin"],
};

export const { pode, assertPode } = criarVerificadorAutorizacao(MATRIZ);

/**
 * Concessão manual é exclusiva de `UsuarioPlataforma` super-admin (009),
 * não da matriz RBAC de clínica — mesma razão da 009 para não reutilizar
 * `criarVerificadorAutorizacao` tipado em `Papel` de tenant.
 */
export function assertPodeConcederAcessoManual(
  usuario: UsuarioPlataforma,
): void {
  if (usuario.papel !== "super-admin") {
    throw new PermissaoNegadaError(usuario.papel, "conceder_acesso_manual");
  }
}
