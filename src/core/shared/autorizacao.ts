import type { Papel } from "@/core/auth/domain/Papel";

import { PermissaoNegadaError } from "./errors";

/**
 * Factory de verificadores de autorização por matriz de ações.
 * Cada módulo mantém sua própria lista de ações e matriz (regra de negócio).
 */
export function criarVerificadorAutorizacao<TAcao extends string>(
  matriz: Record<TAcao, readonly Papel[]>,
) {
  function pode(papel: Papel, acao: TAcao): boolean {
    return matriz[acao].includes(papel);
  }

  function assertPode(papel: Papel, acao: TAcao): void {
    if (!pode(papel, acao)) {
      throw new PermissaoNegadaError(papel, acao);
    }
  }

  return { pode, assertPode };
}
