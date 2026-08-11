import { and, desc, eq } from "drizzle-orm";

import type { SnapshotCabecalhoDocumentoProps } from "@/core/shared/SnapshotCabecalhoDocumento";
import type { db as Db } from "@/db";
import { atestado as atestadoTable } from "@/db/schema/atestado";

import type { AtestadoRepositoryPort } from "../../application/ports/AtestadoRepositoryPort";
import { Atestado } from "../../domain/Atestado";

type Database = typeof Db;

type CabecalhoPersistido = Omit<
  SnapshotCabecalhoDocumentoProps,
  "pacienteDataNascimento"
> & {
  pacienteDataNascimento: string | null;
};

export class DrizzleAtestadoRepository implements AtestadoRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(atestado: Atestado): Promise<void> {
    await this.db.insert(atestadoTable).values({
      id: atestado.id,
      clinicaId: atestado.clinicaId,
      prontuarioId: atestado.prontuarioId,
      profissionalId: atestado.profissionalId,
      motivo: atestado.motivo,
      cid: atestado.cid,
      dataInicio: atestado.dataInicio,
      quantidadeDias: atestado.quantidadeDias,
      dataFim: atestado.dataFim,
      cabecalho: serializarCabecalho(atestado.cabecalho.paraProps()),
      emitidaEm: atestado.emitidaEm,
      assinaturaDigitalId: atestado.assinaturaDigitalId,
    });
  }

  async buscarPorId(
    clinicaId: string,
    atestadoId: string,
  ): Promise<Atestado | null> {
    const rows = await this.db
      .select()
      .from(atestadoTable)
      .where(
        and(
          eq(atestadoTable.clinicaId, clinicaId),
          eq(atestadoTable.id, atestadoId),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Atestado[]> {
    const rows = await this.db
      .select()
      .from(atestadoTable)
      .where(
        and(
          eq(atestadoTable.clinicaId, clinicaId),
          eq(atestadoTable.prontuarioId, prontuarioId),
        ),
      )
      .orderBy(desc(atestadoTable.emitidaEm));
    return rows.map(toDomain);
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

function toDomain(row: {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  profissionalId: string;
  motivo: string;
  cid: string | null;
  dataInicio: Date;
  quantidadeDias: number;
  dataFim: Date;
  cabecalho: unknown;
  emitidaEm: Date;
  assinaturaDigitalId: string | null;
}): Atestado {
  const cabecalhoRaw = row.cabecalho as CabecalhoPersistido;
  return Atestado.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    prontuarioId: row.prontuarioId,
    profissionalId: row.profissionalId,
    motivo: row.motivo,
    cid: row.cid,
    dataInicio: row.dataInicio,
    quantidadeDias: row.quantidadeDias,
    dataFim: row.dataFim,
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
