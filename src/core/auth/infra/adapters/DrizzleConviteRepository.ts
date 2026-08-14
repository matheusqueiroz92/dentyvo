import { and, eq, isNull } from "drizzle-orm";

import type { ConviteRepositoryPort } from "../../application/ports/ConviteRepositoryPort";
import { Convite } from "../../domain/Convite";
import { assertPapel } from "../../domain/Papel";
import type { db as Db } from "@/db";
import { convite as conviteTable } from "@/db/schema";

type Database = typeof Db;

export class DrizzleConviteRepository implements ConviteRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(convite: Convite): Promise<void> {
    await this.db
      .insert(conviteTable)
      .values({
        id: convite.id,
        clinicaId: convite.clinicaId,
        email: convite.email,
        papel: convite.papel,
        token: convite.token,
        expiresAt: convite.expiresAt,
        aceitoEm: convite.aceitoEm,
        convidadoPorUsuarioId: convite.convidadoPorUsuarioId,
      })
      .onConflictDoUpdate({
        target: conviteTable.id,
        set: {
          clinicaId: convite.clinicaId,
          email: convite.email,
          papel: convite.papel,
          token: convite.token,
          expiresAt: convite.expiresAt,
          aceitoEm: convite.aceitoEm,
          convidadoPorUsuarioId: convite.convidadoPorUsuarioId,
        },
      });
  }

  async buscarPorToken(token: string): Promise<Convite | null> {
    const row = await this.db.query.convite.findFirst({
      where: eq(conviteTable.token, token),
    });
    return row ? toDomain(row) : null;
  }

  async buscarPendentePorEmailEClinica(
    clinicaId: string,
    email: string,
  ): Promise<Convite | null> {
    const normalizado = email.trim().toLowerCase();
    const row = await this.db.query.convite.findFirst({
      where: and(
        eq(conviteTable.clinicaId, clinicaId),
        eq(conviteTable.email, normalizado),
        isNull(conviteTable.aceitoEm),
      ),
    });
    return row ? toDomain(row) : null;
  }

  async listarPendentesPorClinica(clinicaId: string): Promise<Convite[]> {
    const rows = await this.db.query.convite.findMany({
      where: and(
        eq(conviteTable.clinicaId, clinicaId),
        isNull(conviteTable.aceitoEm),
      ),
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  email: string;
  papel: string;
  token: string;
  expiresAt: Date;
  aceitoEm: Date | null;
  convidadoPorUsuarioId: string;
}): Convite {
  return Convite.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    email: row.email,
    papel: assertPapel(row.papel),
    token: row.token,
    expiresAt: row.expiresAt,
    aceitoEm: row.aceitoEm,
    convidadoPorUsuarioId: row.convidadoPorUsuarioId,
  });
}
