import { desc, eq } from "drizzle-orm";

import type { db as Db } from "@/db";
import { cobranca as cobrancaTable } from "@/db/schema";

import type { CobrancaRepositoryPort } from "../../application/ports/CobrancaRepositoryPort";
import { Cobranca } from "../../domain/Cobranca";
import { assertMetodoPagamento } from "../../domain/MetodoPagamento";
import { assertStatusCobranca } from "../../domain/StatusCobranca";

type Database = typeof Db;

export class DrizzleCobrancaRepository implements CobrancaRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(cobranca: Cobranca): Promise<void> {
    await this.db
      .insert(cobrancaTable)
      .values({
        id: cobranca.id,
        assinaturaId: cobranca.assinaturaId,
        gatewayCobrancaId: cobranca.gatewayCobrancaId,
        valor: cobranca.valor,
        metodo: cobranca.metodo,
        status: cobranca.status,
        vencimento: cobranca.vencimento,
        pagaEm: cobranca.pagaEm,
        vencidaEm: cobranca.vencidaEm,
        linkPagamento: cobranca.linkPagamento,
      })
      .onConflictDoUpdate({
        target: cobrancaTable.id,
        set: {
          assinaturaId: cobranca.assinaturaId,
          gatewayCobrancaId: cobranca.gatewayCobrancaId,
          valor: cobranca.valor,
          metodo: cobranca.metodo,
          status: cobranca.status,
          vencimento: cobranca.vencimento,
          pagaEm: cobranca.pagaEm,
          vencidaEm: cobranca.vencidaEm,
          linkPagamento: cobranca.linkPagamento,
        },
      });
  }

  async buscarPorId(id: string): Promise<Cobranca | null> {
    const row = await this.db.query.cobranca.findFirst({
      where: eq(cobrancaTable.id, id),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPorGatewayCobrancaId(
    gatewayCobrancaId: string,
  ): Promise<Cobranca | null> {
    const row = await this.db.query.cobranca.findFirst({
      where: eq(cobrancaTable.gatewayCobrancaId, gatewayCobrancaId),
    });
    return row ? toDomain(row) : null;
  }

  async listarPorAssinaturaId(assinaturaId: string): Promise<Cobranca[]> {
    const rows = await this.db.query.cobranca.findMany({
      where: eq(cobrancaTable.assinaturaId, assinaturaId),
      orderBy: [desc(cobrancaTable.vencimento)],
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  assinaturaId: string;
  gatewayCobrancaId: string;
  valor: number;
  metodo: string;
  status: string;
  vencimento: Date;
  pagaEm: Date | null;
  vencidaEm: Date | null;
  linkPagamento: string | null;
}): Cobranca {
  return Cobranca.reconstituir({
    id: row.id,
    assinaturaId: row.assinaturaId,
    gatewayCobrancaId: row.gatewayCobrancaId,
    valor: row.valor,
    metodo: assertMetodoPagamento(row.metodo),
    status: assertStatusCobranca(row.status),
    vencimento: row.vencimento,
    pagaEm: row.pagaEm,
    vencidaEm: row.vencidaEm,
    linkPagamento: row.linkPagamento,
  });
}
