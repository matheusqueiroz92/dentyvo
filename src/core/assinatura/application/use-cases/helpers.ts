import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { Profissional } from "@/core/auth/domain/Profissional";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";
import {
  AuditoriaLog,
  type DetalheAuditoria,
} from "@/core/prontuario/domain/AuditoriaLog";
import {
  PermissaoNegadaError,
  TenantMismatchError,
} from "@/core/shared/errors";
import type { UsuarioPlataforma } from "@/core/admin-plataforma/domain/UsuarioPlataforma";
import type { UsuarioPlataformaRepositoryPort } from "@/core/admin-plataforma/application/ports/UsuarioPlataformaRepositoryPort";
import { UsuarioPlataformaNaoEncontradoError } from "@/core/admin-plataforma/domain/errors";

import type { AcaoAssinatura } from "../../domain/autorizacao";
import {
  assertPode,
  assertPodeConcederAcessoManual,
} from "../../domain/autorizacao";

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

export function autorizarClinica(
  solicitante: Profissional,
  acao: AcaoAssinatura,
): void {
  assertPode(solicitante.papel, acao);
}

export async function obterSolicitantePlataforma(
  usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
  usuarioPlataformaId: string,
): Promise<UsuarioPlataforma> {
  const solicitante =
    await usuarioPlataformaRepo.buscarPorId(usuarioPlataformaId);
  if (!solicitante) {
    throw new UsuarioPlataformaNaoEncontradoError(usuarioPlataformaId);
  }
  return solicitante;
}

export function autorizarConcessaoManual(solicitante: UsuarioPlataforma): void {
  assertPodeConcederAcessoManual(solicitante);
}

export async function registrarAuditoriaConcessaoManual(input: {
  auditoria: AuditoriaLogPort;
  solicitante: UsuarioPlataforma;
  clinicaId: string;
  assinaturaId: string;
  motivo: string;
}): Promise<void> {
  const detalhe: DetalheAuditoria = { motivo: input.motivo };
  await input.auditoria.registrar(
    AuditoriaLog.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      atorUsuarioId: input.solicitante.id,
      atorUsuarioPlataformaId: input.solicitante.id,
      atorProfissionalId: null,
      acao: "escrita",
      recursoTipo: "assinatura",
      recursoId: input.assinaturaId,
      detalhe,
    }),
  );
}
