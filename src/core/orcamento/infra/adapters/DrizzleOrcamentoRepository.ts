import { randomUUID } from "node:crypto";

import { and, asc, desc, eq } from "drizzle-orm";

import type { db as Db } from "@/db";
import {
  itemOrcamento as itemOrcamentoTable,
  orcamento as orcamentoTable,
} from "@/db/schema/orcamento";
import type { SnapshotCabecalhoDocumentoProps } from "@/core/shared/SnapshotCabecalhoDocumento";

import type { OrcamentoRepositoryPort } from "../../application/ports/OrcamentoRepositoryPort";
import type { ItemOrcamentoProps } from "../../domain/ItemOrcamento";
import { Orcamento, type StatusOrcamento } from "../../domain/Orcamento";
import { OrcamentoStatusConflitoError } from "../../domain/errors";

type Database = typeof Db;

type CabecalhoPersistido = Omit<
  SnapshotCabecalhoDocumentoProps,
  "pacienteDataNascimento"
> & {
  pacienteDataNascimento: string | null;
};

export class DrizzleOrcamentoRepository implements OrcamentoRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(orcamento: Orcamento): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(orcamentoTable).values({
        id: orcamento.id,
        clinicaId: orcamento.clinicaId,
        prontuarioId: orcamento.prontuarioId,
        profissionalId: orcamento.profissionalId,
        status: orcamento.status,
        cabecalho: serializarCabecalho(orcamento.cabecalho.paraProps()),
        validoAte: orcamento.validoAte,
        emitidoEm: orcamento.emitidoEm,
      });

      if (orcamento.itens.length === 0) return;

      await tx.insert(itemOrcamentoTable).values(
        orcamento.itens.map((item, index) => ({
          id: randomUUID(),
          orcamentoId: orcamento.id,
          procedimentoId: item.procedimentoId,
          nome: item.nome,
          valor: item.valor,
          quantidade: item.quantidade,
          ordem: index,
        })),
      );
    });
  }

  /**
   * UPDATE condicional: só altera se ainda estiver `enviado`.
   * 0 linhas → `OrcamentoStatusConflitoError`.
   */
  async atualizarStatus(orcamento: Orcamento): Promise<void> {
    const atualizados = await this.db
      .update(orcamentoTable)
      .set({ status: orcamento.status })
      .where(
        and(
          eq(orcamentoTable.id, orcamento.id),
          eq(orcamentoTable.clinicaId, orcamento.clinicaId),
          eq(orcamentoTable.status, "enviado"),
        ),
      )
      .returning({ id: orcamentoTable.id });

    if (atualizados.length === 0) {
      throw new OrcamentoStatusConflitoError(orcamento.id);
    }
  }

  async buscarPorId(
    clinicaId: string,
    orcamentoId: string,
  ): Promise<Orcamento | null> {
    const rows = await this.db
      .select()
      .from(orcamentoTable)
      .where(
        and(
          eq(orcamentoTable.clinicaId, clinicaId),
          eq(orcamentoTable.id, orcamentoId),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    const itens = await this.carregarItens(orcamentoId);
    return toDomain(row, itens);
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Orcamento[]> {
    const rows = await this.db
      .select()
      .from(orcamentoTable)
      .where(
        and(
          eq(orcamentoTable.clinicaId, clinicaId),
          eq(orcamentoTable.prontuarioId, prontuarioId),
        ),
      )
      .orderBy(desc(orcamentoTable.emitidoEm));

    const resultado: Orcamento[] = [];
    for (const row of rows) {
      const itens = await this.carregarItens(row.id);
      resultado.push(toDomain(row, itens));
    }
    return resultado;
  }

  private async carregarItens(
    orcamentoId: string,
  ): Promise<ItemOrcamentoProps[]> {
    const rows = await this.db
      .select()
      .from(itemOrcamentoTable)
      .where(eq(itemOrcamentoTable.orcamentoId, orcamentoId))
      .orderBy(asc(itemOrcamentoTable.ordem));

    return rows.map((row) => ({
      procedimentoId: row.procedimentoId,
      nome: row.nome,
      valor: row.valor,
      quantidade: row.quantidade,
    }));
  }
}

function serializarCabecalho(
  cabecalho: SnapshotCabecalhoDocumentoProps,
): CabecalhoPersistido {
  return {
    ...cabecalho,
    pacienteDataNascimento: cabecalho.pacienteDataNascimento
      ? cabecalho.pacienteDataNascimento.toISOString()
      : null,
  };
}

function toDomain(
  row: {
    id: string;
    clinicaId: string;
    prontuarioId: string;
    profissionalId: string;
    status: string;
    cabecalho: unknown;
    validoAte: Date | null;
    emitidoEm: Date;
  },
  itens: ItemOrcamentoProps[],
): Orcamento {
  const cabecalhoRaw = row.cabecalho as CabecalhoPersistido;
  return Orcamento.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    prontuarioId: row.prontuarioId,
    profissionalId: row.profissionalId,
    status: row.status as StatusOrcamento,
    itens,
    cabecalho: {
      ...cabecalhoRaw,
      pacienteDataNascimento: cabecalhoRaw.pacienteDataNascimento
        ? new Date(cabecalhoRaw.pacienteDataNascimento)
        : null,
    },
    validoAte: row.validoAte,
    emitidoEm: row.emitidoEm,
  });
}
