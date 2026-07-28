import type { AuditoriaLogPort } from "../../application/ports/AuditoriaLogPort";
import {
  AuditoriaLog,
  type AcaoAuditoria,
  type DetalheAuditoria,
  type RecursoAuditoria,
} from "../../domain/AuditoriaLog";
import type { db as Db } from "@/db";
import { auditoriaLog as auditoriaLogTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleAuditoriaLogPort implements AuditoriaLogPort {
  constructor(private readonly db: Database) {}

  async registrar(evento: AuditoriaLog): Promise<void> {
    await this.db.insert(auditoriaLogTable).values({
      id: evento.id,
      clinicaId: evento.clinicaId,
      atorUsuarioId: evento.atorUsuarioId,
      atorProfissionalId: evento.atorProfissionalId,
      atorUsuarioPlataformaId: evento.atorUsuarioPlataformaId,
      acao: evento.acao,
      recursoTipo: evento.recursoTipo,
      recursoId: evento.recursoId,
      pacienteId: evento.pacienteId,
      ocorridoEm: evento.ocorridoEm,
      detalhe: evento.detalhe,
    });
  }
}

/** Útil em testes de integração / reconstituição. */
export function auditoriaLogFromRow(row: {
  id: string;
  clinicaId: string | null;
  atorUsuarioId: string;
  atorProfissionalId: string | null;
  atorUsuarioPlataformaId: string | null;
  acao: string;
  recursoTipo: string;
  recursoId: string;
  pacienteId: string | null;
  ocorridoEm: Date;
  detalhe: unknown;
}): AuditoriaLog {
  return AuditoriaLog.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    atorUsuarioId: row.atorUsuarioId,
    atorProfissionalId: row.atorProfissionalId,
    atorUsuarioPlataformaId: row.atorUsuarioPlataformaId,
    acao: row.acao as AcaoAuditoria,
    recursoTipo: row.recursoTipo as RecursoAuditoria,
    recursoId: row.recursoId,
    pacienteId: row.pacienteId,
    ocorridoEm: row.ocorridoEm,
    detalhe: (row.detalhe as DetalheAuditoria | null) ?? null,
  });
}
