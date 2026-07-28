import { randomUUID } from "node:crypto";

import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";
import {
  AuditoriaLog,
  type AcaoAuditoria,
  type DetalheAuditoria,
  type RecursoAuditoria,
} from "@/core/prontuario/domain/AuditoriaLog";

import type { AcaoAdminPlataforma } from "../../domain/autorizacao";
import { assertPode } from "../../domain/autorizacao";
import { UsuarioPlataformaNaoEncontradoError } from "../../domain/errors";
import type { UsuarioPlataforma } from "../../domain/UsuarioPlataforma";
import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";

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

export function autorizar(
  solicitante: UsuarioPlataforma,
  acao: AcaoAdminPlataforma,
): void {
  assertPode(solicitante, acao);
}

export async function registrarAuditoriaPlataforma(input: {
  auditoria: AuditoriaLogPort;
  solicitante: UsuarioPlataforma;
  clinicaId?: string | null;
  acao: AcaoAuditoria;
  recursoTipo: RecursoAuditoria;
  recursoId: string;
  detalhe?: DetalheAuditoria | null;
}): Promise<void> {
  await input.auditoria.registrar(
    AuditoriaLog.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId ?? null,
      atorUsuarioId: input.solicitante.id,
      atorUsuarioPlataformaId: input.solicitante.id,
      atorProfissionalId: null,
      acao: input.acao,
      recursoTipo: input.recursoTipo,
      recursoId: input.recursoId,
      detalhe: input.detalhe,
    }),
  );
}
