import { and, asc, desc, eq } from "drizzle-orm";

import type { AnamneseRepositoryPort } from "../../application/ports/AnamneseRepositoryPort";
import { Anamnese } from "../../domain/Anamnese";
import type { RespostasAnamneseProps } from "../../domain/RespostasAnamnese";
import type { db as Db } from "@/db";
import { anamnese as anamneseTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleAnamneseRepository implements AnamneseRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(anamnese: Anamnese): Promise<void> {
    await this.db.insert(anamneseTable).values({
      id: anamnese.id,
      clinicaId: anamnese.clinicaId,
      prontuarioId: anamnese.prontuarioId,
      versao: anamnese.versao,
      respostas: anamnese.respostas.toProps(),
      preenchidoEm: anamnese.preenchidoEm,
      preenchidoPorProfissionalId: anamnese.preenchidoPorProfissionalId,
    });
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Anamnese[]> {
    const rows = await this.db
      .select()
      .from(anamneseTable)
      .where(
        and(
          eq(anamneseTable.clinicaId, clinicaId),
          eq(anamneseTable.prontuarioId, prontuarioId),
        ),
      )
      .orderBy(asc(anamneseTable.versao));
    return rows.map(toDomain);
  }

  async buscarVersaoVigente(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Anamnese | null> {
    const rows = await this.db
      .select()
      .from(anamneseTable)
      .where(
        and(
          eq(anamneseTable.clinicaId, clinicaId),
          eq(anamneseTable.prontuarioId, prontuarioId),
        ),
      )
      .orderBy(desc(anamneseTable.versao))
      .limit(1);
    const row = rows[0];
    return row ? toDomain(row) : null;
  }
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  versao: number;
  respostas: unknown;
  preenchidoEm: Date;
  preenchidoPorProfissionalId: string;
}): Anamnese {
  return Anamnese.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    prontuarioId: row.prontuarioId,
    versao: row.versao,
    respostas: row.respostas as RespostasAnamneseProps,
    preenchidoEm: row.preenchidoEm,
    preenchidoPorProfissionalId: row.preenchidoPorProfissionalId,
  });
}
