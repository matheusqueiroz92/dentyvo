import { count, eq, sql } from "drizzle-orm";

import type { db as Db } from "@/db";
import { vagaPromocionalLancamento as vagaTable } from "@/db/schema";

import type {
  ReservarVagaPromocionalAtomicoInput,
  VagaPromocionalRepositoryPort,
} from "../../application/ports/VagaPromocionalRepositoryPort";
import {
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
  MAX_RETRIES_RESERVA_VAGA_POSICAO,
} from "../../domain/constants";
import { VagasPromocionaisEsgotadasError } from "../../domain/errors";
import { VagaPromocional } from "../../domain/VagaPromocional";

type Database = typeof Db;

type VagaRow = {
  posicao: number;
  clinica_id: string;
  assinatura_id: string;
  reservada_em: Date;
};

/**
 * Adapter Drizzle da reserva promocional (spec 012, D3).
 *
 * `reservarAtomico` usa **uma única** statement
 * `INSERT … SELECT generate_series + NOT EXISTS + LIMIT 1`, com retry
 * apenas em `unique_violation` da PK `posicao`.
 */
export class DrizzleVagaPromocionalRepository
  implements VagaPromocionalRepositoryPort
{
  constructor(private readonly db: Database) {}

  async reservarAtomico(
    input: ReservarVagaPromocionalAtomicoInput,
  ): Promise<VagaPromocional> {
    const existente = await this.buscarPorClinica(input.clinicaId);
    if (existente) return existente;

    for (let tentativa = 0; tentativa < MAX_RETRIES_RESERVA_VAGA_POSICAO; tentativa++) {
      try {
        const result = await this.db.execute(sql`
          INSERT INTO vaga_promocional_lancamento
            (posicao, clinica_id, assinatura_id, reservada_em)
          SELECT s.posicao, ${input.clinicaId}, ${input.assinaturaId}, ${input.agora}
          FROM generate_series(1, ${LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO}) AS s(posicao)
          WHERE NOT EXISTS (
            SELECT 1
            FROM vaga_promocional_lancamento v
            WHERE v.posicao = s.posicao
          )
          ORDER BY s.posicao
          LIMIT 1
          RETURNING posicao, clinica_id, assinatura_id, reservada_em
        `);

        const rows = rowsFromExecute(result);
        if (rows.length === 0) {
          throw new VagasPromocionaisEsgotadasError();
        }

        return toDomain(rows[0]!);
      } catch (error) {
        if (isUniqueViolationOnClinica(error)) {
          const vaga = await this.buscarPorClinica(input.clinicaId);
          if (vaga) return vaga;
          throw error;
        }
        if (isUniqueViolationOnPosicao(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new VagasPromocionaisEsgotadasError();
  }

  async buscarPorClinica(clinicaId: string): Promise<VagaPromocional | null> {
    const row = await this.db.query.vagaPromocionalLancamento.findFirst({
      where: eq(vagaTable.clinicaId, clinicaId),
    });
    return row ? VagaPromocional.reconstituir({
      posicao: row.posicao,
      clinicaId: row.clinicaId,
      assinaturaId: row.assinaturaId,
      reservadaEm: row.reservadaEm,
    }) : null;
  }

  async buscarPorAssinaturaId(
    assinaturaId: string,
  ): Promise<VagaPromocional | null> {
    const row = await this.db.query.vagaPromocionalLancamento.findFirst({
      where: eq(vagaTable.assinaturaId, assinaturaId),
    });
    return row ? VagaPromocional.reconstituir({
      posicao: row.posicao,
      clinicaId: row.clinicaId,
      assinaturaId: row.assinaturaId,
      reservadaEm: row.reservadaEm,
    }) : null;
  }

  async contarReservadas(): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(vagaTable);
    return Number(row?.total ?? 0);
  }
}

function toDomain(row: VagaRow): VagaPromocional {
  return VagaPromocional.criar({
    posicao: Number(row.posicao),
    clinicaId: row.clinica_id,
    assinaturaId: row.assinatura_id,
    reservadaEm:
      row.reservada_em instanceof Date
        ? row.reservada_em
        : new Date(row.reservada_em),
  });
}

function rowsFromExecute(result: unknown): VagaRow[] {
  if (Array.isArray(result)) {
    return result as VagaRow[];
  }
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: VagaRow[] }).rows;
  }
  return [];
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code =
    "code" in error
      ? String((error as { code: unknown }).code)
      : "cause" in error &&
          error.cause &&
          typeof error.cause === "object" &&
          "code" in error.cause
        ? String((error.cause as { code: unknown }).code)
        : "";
  return code === "23505";
}

function constraintName(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const direct =
    "constraint" in error
      ? String((error as { constraint: unknown }).constraint)
      : "";
  if (direct) return direct;
  if (
    "cause" in error &&
    error.cause &&
    typeof error.cause === "object" &&
    "constraint" in error.cause
  ) {
    return String((error.cause as { constraint: unknown }).constraint);
  }
  const message =
    error instanceof Error
      ? error.message
      : "message" in error
        ? String((error as { message: unknown }).message)
        : "";
  return message;
}

function isUniqueViolationOnPosicao(error: unknown): boolean {
  if (!isUniqueViolation(error)) return false;
  const c = constraintName(error).toLowerCase();
  return (
    c.includes("posicao") ||
    c.includes("pkey") ||
    c.includes("vaga_promocional_lancamento_pkey") ||
    c === ""
  );
}

function isUniqueViolationOnClinica(error: unknown): boolean {
  if (!isUniqueViolation(error)) return false;
  const c = constraintName(error).toLowerCase();
  return c.includes("clinica");
}
