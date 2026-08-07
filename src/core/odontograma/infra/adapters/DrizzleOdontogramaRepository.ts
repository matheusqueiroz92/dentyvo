import { and, asc, eq, gte, lte } from "drizzle-orm";

import type { db as Db } from "@/db";
import { eventoOdontograma as eventoTable } from "@/db/schema/odontograma";

import type {
  FiltrosHistoricoOdontograma,
  OdontogramaRepositoryPort,
} from "../../application/ports/OdontogramaRepositoryPort";
import type { EstadoOdontograma } from "../../domain/EstadoOdontograma";
import {
  EventoOdontograma,
  type NivelEventoOdontograma,
} from "../../domain/EventoOdontograma";
import type { FaceOdontograma } from "../../domain/FaceOdontograma";

type Database = typeof Db;

/**
 * Persistência Drizzle de eventos do odontograma (spec 004).
 * `salvarEventos` é atômico via `db.transaction` — tudo-ou-nada.
 *
 * `sequencia` (bigserial) é atribuída por **insert sequencial na ordem do
 * array** — um por vez na mesma transação — para cumprir o contrato da
 * port: índice i < j ⇒ sequencia(i) < sequencia(j). Não usa Promise.all
 * nem multi-row INSERT (ordem de bigserial não é garantia portável).
 */
export class DrizzleOdontogramaRepository implements OdontogramaRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvarEventos(
    eventos: EventoOdontograma[],
  ): Promise<EventoOdontograma[]> {
    if (eventos.length === 0) {
      return [];
    }

    return this.db.transaction(async (tx) => {
      const persistidos: EventoOdontograma[] = [];

      for (const evento of eventos) {
        const [row] = await tx
          .insert(eventoTable)
          .values({
            id: evento.id,
            clinicaId: evento.clinicaId,
            prontuarioId: evento.prontuarioId,
            numeroDente: evento.numeroDente,
            nivel: evento.nivel,
            face: evento.face,
            estadoNovo: evento.estadoNovo,
            procedimentoId: evento.procedimentoId,
            registradoEm: evento.registradoEm,
            profissionalId: evento.profissionalId,
            // sequencia omitida — bigserial no banco, monotônico por insert
          })
          .returning();

        if (!row) {
          throw new Error(
            "Falha ao persistir evento de odontograma (sem row retornada).",
          );
        }
        persistidos.push(toDomain(row));
      }

      return persistidos;
    });
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
    filtros?: FiltrosHistoricoOdontograma,
  ): Promise<EventoOdontograma[]> {
    const condicoes = [
      eq(eventoTable.clinicaId, clinicaId),
      eq(eventoTable.prontuarioId, prontuarioId),
    ];

    if (filtros?.numeroDente != null) {
      condicoes.push(eq(eventoTable.numeroDente, filtros.numeroDente));
    }
    if (filtros?.face != null) {
      condicoes.push(eq(eventoTable.face, filtros.face));
    }
    if (filtros?.de != null) {
      condicoes.push(gte(eventoTable.registradoEm, filtros.de));
    }
    if (filtros?.ate != null) {
      condicoes.push(lte(eventoTable.registradoEm, filtros.ate));
    }

    const rows = await this.db
      .select()
      .from(eventoTable)
      .where(and(...condicoes))
      .orderBy(asc(eventoTable.registradoEm), asc(eventoTable.sequencia));

    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  numeroDente: number;
  nivel: string;
  face: string | null;
  estadoNovo: string;
  procedimentoId: string | null;
  registradoEm: Date;
  profissionalId: string;
  sequencia: number;
}): EventoOdontograma {
  return EventoOdontograma.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    prontuarioId: row.prontuarioId,
    numeroDente: row.numeroDente,
    nivel: row.nivel as NivelEventoOdontograma,
    face: row.face as FaceOdontograma | null,
    estadoNovo: row.estadoNovo as EstadoOdontograma,
    procedimentoId: row.procedimentoId,
    registradoEm: row.registradoEm,
    profissionalId: row.profissionalId,
    sequencia: row.sequencia,
  });
}
