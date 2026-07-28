import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { Profissional } from "@/core/auth/domain/Profissional";
import {
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";

import type { AcaoProntuario } from "../../domain/autorizacao";
import { assertPode } from "../../domain/autorizacao";
import {
  AuditoriaLog,
  type DetalheAuditoria,
  type RecursoAuditoria,
} from "../../domain/AuditoriaLog";
import type { AuditoriaLogPort } from "../ports/AuditoriaLogPort";

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
  acao: AcaoProntuario,
): void {
  assertPode(solicitante.papel, acao);
}

/**
 * Resolve solicitante + RBAC; em falha de permissão/tenant registra
 * `acesso_negado` quando o profissional da sessão for conhecido.
 */
export async function autorizarComAuditoria(input: {
  profissionalRepo: ProfissionalRepositoryPort;
  auditoria: AuditoriaLogPort;
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  acao: AcaoProntuario;
  recursoTipo: RecursoAuditoria;
  recursoId: string;
  pacienteId?: string | null;
}): Promise<Profissional> {
  const solicitante = await input.profissionalRepo.buscarPorUsuarioId(
    input.solicitadoPorUsuarioId,
  );

  if (!solicitante) {
    throw new PermissaoNegadaError("desconhecido", "acesso");
  }

  if (solicitante.clinicaId !== input.clinicaId) {
    await registrarAcessoNegado({
      auditoria: input.auditoria,
      clinicaId: input.clinicaId,
      solicitante,
      recursoTipo: input.recursoTipo,
      recursoId: input.recursoId,
      pacienteId: input.pacienteId,
      acaoNegada: input.acao,
    });
    throw new TenantMismatchError(input.clinicaId, solicitante.clinicaId);
  }

  try {
    autorizar(solicitante, input.acao);
  } catch (error) {
    if (error instanceof PermissaoNegadaError) {
      await registrarAcessoNegado({
        auditoria: input.auditoria,
        clinicaId: input.clinicaId,
        solicitante,
        recursoTipo: input.recursoTipo,
        recursoId: input.recursoId,
        pacienteId: input.pacienteId,
        acaoNegada: input.acao,
      });
    }
    throw error;
  }

  return solicitante;
}

export async function registrarAuditoriaEscrita(input: {
  auditoria: AuditoriaLogPort;
  clinicaId: string;
  solicitante: Profissional;
  recursoTipo: RecursoAuditoria;
  recursoId: string;
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
      recursoTipo: input.recursoTipo,
      recursoId: input.recursoId,
      pacienteId: input.pacienteId,
      detalhe: input.detalhe,
    }),
  );
}

export async function registrarAuditoriaLeitura(input: {
  auditoria: AuditoriaLogPort;
  clinicaId: string;
  solicitante: Profissional;
  recursoTipo: RecursoAuditoria;
  recursoId: string;
  pacienteId?: string | null;
  detalhe?: DetalheAuditoria | null;
}): Promise<void> {
  await input.auditoria.registrar(
    AuditoriaLog.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      atorUsuarioId: input.solicitante.usuarioId,
      atorProfissionalId: input.solicitante.id,
      acao: "leitura",
      recursoTipo: input.recursoTipo,
      recursoId: input.recursoId,
      pacienteId: input.pacienteId,
      detalhe: input.detalhe,
    }),
  );
}

async function registrarAcessoNegado(input: {
  auditoria: AuditoriaLogPort;
  clinicaId: string;
  solicitante: Profissional;
  recursoTipo: RecursoAuditoria;
  recursoId: string;
  pacienteId?: string | null;
  acaoNegada: string;
}): Promise<void> {
  await input.auditoria.registrar(
    AuditoriaLog.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      atorUsuarioId: input.solicitante.usuarioId,
      atorProfissionalId: input.solicitante.id,
      acao: "acesso_negado",
      recursoTipo: input.recursoTipo,
      recursoId: input.recursoId,
      pacienteId: input.pacienteId,
      detalhe: { acaoNegada: input.acaoNegada },
    }),
  );
}
