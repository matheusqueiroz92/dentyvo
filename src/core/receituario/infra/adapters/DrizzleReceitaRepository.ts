import { and, desc, eq } from "drizzle-orm";

import type { db as Db } from "@/db";
import { receita as receitaTable } from "@/db/schema/receituario";

import type { ReceitaRepositoryPort } from "../../application/ports/ReceitaRepositoryPort";
import type { ItemReceitaProps } from "../../domain/ItemReceita";
import { Receita } from "../../domain/Receita";
import type { SnapshotCabecalhoReceitaProps } from "../../domain/SnapshotCabecalhoReceita";

type Database = typeof Db;

type CabecalhoPersistido = Omit<
  SnapshotCabecalhoReceitaProps,
  "pacienteDataNascimento"
> & {
  pacienteDataNascimento: string | null;
};

export class DrizzleReceitaRepository implements ReceitaRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(receita: Receita): Promise<void> {
    await this.db.insert(receitaTable).values({
      id: receita.id,
      clinicaId: receita.clinicaId,
      prontuarioId: receita.prontuarioId,
      profissionalId: receita.profissionalId,
      itens: receita.itens.map((item) => item.paraProps()),
      cabecalho: serializarCabecalho(receita.cabecalho.paraProps()),
      emitidaEm: receita.emitidaEm,
      assinaturaDigitalId: receita.assinaturaDigitalId,
    });
  }

  async buscarPorId(
    clinicaId: string,
    receitaId: string,
  ): Promise<Receita | null> {
    const rows = await this.db
      .select()
      .from(receitaTable)
      .where(
        and(
          eq(receitaTable.clinicaId, clinicaId),
          eq(receitaTable.id, receitaId),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Receita[]> {
    const rows = await this.db
      .select()
      .from(receitaTable)
      .where(
        and(
          eq(receitaTable.clinicaId, clinicaId),
          eq(receitaTable.prontuarioId, prontuarioId),
        ),
      )
      .orderBy(desc(receitaTable.emitidaEm));
    return rows.map(toDomain);
  }
}

function serializarCabecalho(
  cabecalho: SnapshotCabecalhoReceitaProps,
): CabecalhoPersistido {
  return {
    ...cabecalho,
    pacienteDataNascimento: cabecalho.pacienteDataNascimento
      ? cabecalho.pacienteDataNascimento.toISOString()
      : null,
  };
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  profissionalId: string;
  itens: unknown;
  cabecalho: unknown;
  emitidaEm: Date;
  assinaturaDigitalId: string | null;
}): Receita {
  const cabecalhoRaw = row.cabecalho as CabecalhoPersistido;
  return Receita.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    prontuarioId: row.prontuarioId,
    profissionalId: row.profissionalId,
    itens: row.itens as ItemReceitaProps[],
    cabecalho: {
      ...cabecalhoRaw,
      pacienteDataNascimento: cabecalhoRaw.pacienteDataNascimento
        ? new Date(cabecalhoRaw.pacienteDataNascimento)
        : null,
    },
    emitidaEm: row.emitidaEm,
    assinaturaDigitalId: row.assinaturaDigitalId,
  });
}
