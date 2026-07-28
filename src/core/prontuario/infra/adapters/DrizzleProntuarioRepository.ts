import { and, eq } from "drizzle-orm";

import type { ProntuarioRepositoryPort } from "../../application/ports/ProntuarioRepositoryPort";
import { Prontuario } from "../../domain/Prontuario";
import type { db as Db } from "@/db";
import { prontuario as prontuarioTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleProntuarioRepository implements ProntuarioRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(prontuario: Prontuario): Promise<void> {
    await this.db.insert(prontuarioTable).values({
      id: prontuario.id,
      clinicaId: prontuario.clinicaId,
      pacienteId: prontuario.pacienteId,
      criadoEm: prontuario.criadoEm,
    });
  }

  async buscarPorId(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Prontuario | null> {
    const rows = await this.db
      .select()
      .from(prontuarioTable)
      .where(
        and(
          eq(prontuarioTable.id, prontuarioId),
          eq(prontuarioTable.clinicaId, clinicaId),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async buscarPorPacienteId(
    clinicaId: string,
    pacienteId: string,
  ): Promise<Prontuario | null> {
    const rows = await this.db
      .select()
      .from(prontuarioTable)
      .where(
        and(
          eq(prontuarioTable.clinicaId, clinicaId),
          eq(prontuarioTable.pacienteId, pacienteId),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? toDomain(row) : null;
  }
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  pacienteId: string;
  criadoEm: Date;
}): Prontuario {
  return Prontuario.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    pacienteId: row.pacienteId,
    criadoEm: row.criadoEm,
  });
}
