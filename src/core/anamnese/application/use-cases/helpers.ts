import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { Profissional } from "@/core/auth/domain/Profissional";
import {
  AuditoriaLog,
  type DetalheAuditoria,
} from "@/core/prontuario/domain/AuditoriaLog";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";
import {
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

import type { AcaoAnamnese } from "../../domain/autorizacao";
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
  acao: AcaoAnamnese,
): void {
  assertPode(solicitante.papel, acao);
}

export async function registrarAuditoriaEscritaAnamnese(input: {
  auditoria: AuditoriaLogPort;
  clinicaId: string;
  solicitante: Profissional;
  anamneseId: string;
  pacienteId?: string | null;
  detalhe?: DetalheAuditoria | null;
}): Promise<void> {
  await input.auditoria.registrar(
    AuditoriaLog.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      atorUsuarioId: input.solicitante.usuarioId,
      atorProfissionalId: input.solicitante.id,
      acao: "escrita",
      recursoTipo: "anamnese",
      recursoId: input.anamneseId,
      pacienteId: input.pacienteId,
      detalhe: input.detalhe,
    }),
  );
}
