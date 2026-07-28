import { and, eq } from "drizzle-orm";

import type { ProcedimentoRepositoryPort } from "../../application/ports/ProcedimentoRepositoryPort";
import { Procedimento } from "../../domain/Procedimento";
import type { db as Db } from "@/db";
import { procedimento as procedimentoTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleProcedimentoRepository
  implements ProcedimentoRepositoryPort
{
  constructor(private readonly db: Database) {}

  async salvar(procedimento: Procedimento): Promise<void> {
    await this.db
      .insert(procedimentoTable)
      .values({
        id: procedimento.id,
        clinicaId: procedimento.clinicaId,
        nome: procedimento.nome,
        duracaoPadraoMinutos: procedimento.duracaoPadraoMinutos,
        valor: procedimento.valor,
      })
      .onConflictDoUpdate({
        target: procedimentoTable.id,
        set: {
          clinicaId: procedimento.clinicaId,
          nome: procedimento.nome,
          duracaoPadraoMinutos: procedimento.duracaoPadraoMinutos,
          valor: procedimento.valor,
        },
      });
  }

  async buscarPorId(
    clinicaId: string,
    procedimentoId: string,
  ): Promise<Procedimento | null> {
    const row = await this.db.query.procedimento.findFirst({
      where: and(
        eq(procedimentoTable.id, procedimentoId),
        eq(procedimentoTable.clinicaId, clinicaId),
      ),
    });
    return row ? toDomain(row) : null;
  }

  async listarPorClinica(clinicaId: string): Promise<Procedimento[]> {
    const rows = await this.db.query.procedimento.findMany({
      where: eq(procedimentoTable.clinicaId, clinicaId),
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  nome: string;
  duracaoPadraoMinutos: number;
  valor: number;
}): Procedimento {
  return Procedimento.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    nome: row.nome,
    duracaoPadraoMinutos: row.duracaoPadraoMinutos,
    valor: row.valor,
  });
}
