import { and, eq } from "drizzle-orm";

import type { DisponibilidadeProfissionalRepositoryPort } from "../../application/ports/DisponibilidadeProfissionalRepositoryPort";
import {
  DisponibilidadeProfissional,
  type DiaDaSemana,
} from "../../domain/DisponibilidadeProfissional";
import type { db as Db } from "@/db";
import { disponibilidadeProfissional as disponibilidadeTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleDisponibilidadeProfissionalRepository
  implements DisponibilidadeProfissionalRepositoryPort
{
  constructor(private readonly db: Database) {}

  async substituirJanelas(
    clinicaId: string,
    profissionalId: string,
    janelas: DisponibilidadeProfissional[],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(disponibilidadeTable)
        .where(
          and(
            eq(disponibilidadeTable.clinicaId, clinicaId),
            eq(disponibilidadeTable.profissionalId, profissionalId),
          ),
        );

      if (janelas.length === 0) return;

      await tx.insert(disponibilidadeTable).values(
        janelas.map((j) => ({
          id: j.id,
          clinicaId: j.clinicaId,
          profissionalId: j.profissionalId,
          diaDaSemana: j.diaDaSemana,
          horaInicio: j.horaInicio,
          horaFim: j.horaFim,
        })),
      );
    });
  }

  async listarPorProfissional(
    clinicaId: string,
    profissionalId: string,
  ): Promise<DisponibilidadeProfissional[]> {
    const rows = await this.db.query.disponibilidadeProfissional.findMany({
      where: and(
        eq(disponibilidadeTable.clinicaId, clinicaId),
        eq(disponibilidadeTable.profissionalId, profissionalId),
      ),
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  profissionalId: string;
  diaDaSemana: number;
  horaInicio: string;
  horaFim: string;
}): DisponibilidadeProfissional {
  return DisponibilidadeProfissional.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    profissionalId: row.profissionalId,
    diaDaSemana: row.diaDaSemana as DiaDaSemana,
    horaInicio: row.horaInicio,
    horaFim: row.horaFim,
  });
}
