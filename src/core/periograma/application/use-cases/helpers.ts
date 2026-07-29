import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { Profissional } from "@/core/auth/domain/Profissional";
import {
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

import type { AcaoPeriograma } from "../../domain/autorizacao";
import { assertPode } from "../../domain/autorizacao";

/**
 * Resolve o profissional da sessão na clínica (mesmo padrão 003/004/006).
 * `profissionalId` do periograma vem deste solicitante — nunca do input do cliente.
 */
export async function obterSolicitanteNaClinica(
  profissionalRepo: ProfissionalRepositoryPort,
  usuarioId: string,
  clinicaId: string,
): Promise<Profissional> {
  const solicitante = await profissionalRepo.buscarPorUsuarioId(usuarioId);
  if (!solicitante) {
    throw new PermissaoNegadaError("desconhecido", "acesso");
  }
  if (solicitante.clinicaId !== clinicaId) {
    throw new TenantMismatchError(clinicaId, solicitante.clinicaId);
  }
  return solicitante;
}

export function autorizar(
  solicitante: Profissional,
  acao: AcaoPeriograma,
): void {
  assertPode(solicitante.papel, acao);
}
