import { eq } from "drizzle-orm";

import type { db as Db } from "@/db";
import { plano as planoTable } from "@/db/schema";

import type { PlanoRepositoryPort } from "../../application/ports/PlanoRepositoryPort";
import { Plano, type LimitesDeUso } from "../../domain/Plano";

type Database = typeof Db;

export class DrizzlePlanoRepository implements PlanoRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(plano: Plano): Promise<void> {
    await this.db
      .insert(planoTable)
      .values({
        id: plano.id,
        nome: plano.nome,
        valorMensal: plano.valorMensal,
        limitesDeUso: plano.limitesDeUso,
      })
      .onConflictDoUpdate({
        target: planoTable.id,
        set: {
          nome: plano.nome,
          valorMensal: plano.valorMensal,
          limitesDeUso: plano.limitesDeUso,
        },
      });
  }

  async buscarPorId(id: string): Promise<Plano | null> {
    const row = await this.db.query.plano.findFirst({
      where: eq(planoTable.id, id),
    });
    return row ? toDomain(row) : null;
  }

  async listarAtivos(): Promise<Plano[]> {
    const rows = await this.db.query.plano.findMany();
    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  nome: string;
  valorMensal: number;
  limitesDeUso: LimitesDeUso | Record<string, number | undefined> | null;
}): Plano {
  return Plano.reconstituir({
    id: row.id,
    nome: row.nome,
    valorMensal: row.valorMensal,
    limitesDeUso: (row.limitesDeUso ?? {}) as LimitesDeUso,
  });
}
