import {
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

import type { AcaoAutorizada } from "../../domain/autorizacao";
import { assertPode } from "../../domain/autorizacao";
import type { Profissional } from "../../domain/Profissional";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";

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
  acao: AcaoAutorizada,
): void {
  assertPode(solicitante.papel, acao);
}
