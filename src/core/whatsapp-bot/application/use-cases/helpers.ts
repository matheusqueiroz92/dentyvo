import {
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";
import type { Profissional } from "@/core/auth/domain/Profissional";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { AcaoWhatsapp } from "../../domain/autorizacao";
import { assertPode } from "../../domain/autorizacao";

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
  acao: AcaoWhatsapp,
): void {
  assertPode(solicitante.papel, acao);
}
