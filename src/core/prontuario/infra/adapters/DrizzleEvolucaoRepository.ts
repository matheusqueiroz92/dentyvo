import { and, eq } from "drizzle-orm";

import type { EvolucaoRepositoryPort } from "../../application/ports/EvolucaoRepositoryPort";
import { Evolucao, type TipoEvolucao } from "../../domain/Evolucao";
import { EvolucaoJaRetificadaError } from "../../domain/errors";
import type { db as Db } from "@/db";
import { evolucao as evolucaoTable } from "@/db/schema";

type Database = typeof Db;

/**
 * Persistência append-only de evoluções.
 * Violação de UNIQUE em `evolucao_retificada_id` → `EvolucaoJaRetificadaError`
 * (mesmo padrão de EXCLUDE → `SobreposicaoHorarioError` no agendamento).
 */
export class DrizzleEvolucaoRepository implements EvolucaoRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvar(evolucao: Evolucao): Promise<void> {
    try {
      await this.db.insert(evolucaoTable).values(toRow(evolucao));
    } catch (error) {
      throw mapUniqueRetificacaoOrRethrow(error, evolucao);
    }
  }

  async buscarPorId(
    clinicaId: string,
    evolucaoId: string,
  ): Promise<Evolucao | null> {
    const rows = await this.db
      .select()
      .from(evolucaoTable)
      .where(
        and(
          eq(evolucaoTable.id, evolucaoId),
          eq(evolucaoTable.clinicaId, clinicaId),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? toDomain(row) : null;
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Evolucao[]> {
    const rows = await this.db
      .select()
      .from(evolucaoTable)
      .where(
        and(
          eq(evolucaoTable.clinicaId, clinicaId),
          eq(evolucaoTable.prontuarioId, prontuarioId),
        ),
      );
    return rows.map(toDomain);
  }

  async buscarRetificacaoPorOriginal(
    clinicaId: string,
    evolucaoOriginalId: string,
  ): Promise<Evolucao | null> {
    const rows = await this.db
      .select()
      .from(evolucaoTable)
      .where(
        and(
          eq(evolucaoTable.clinicaId, clinicaId),
          eq(evolucaoTable.evolucaoRetificadaId, evolucaoOriginalId),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row ? toDomain(row) : null;
  }
}

function toRow(evolucao: Evolucao) {
  return {
    id: evolucao.id,
    clinicaId: evolucao.clinicaId,
    prontuarioId: evolucao.prontuarioId,
    profissionalId: evolucao.profissionalId,
    tipo: evolucao.tipo,
    descricao: evolucao.descricao,
    registradoEm: evolucao.registradoEm,
    procedimentoId: evolucao.procedimentoId,
    evolucaoRetificadaId: evolucao.evolucaoRetificadaId,
    motivoRetificacao: evolucao.motivoRetificacao,
  };
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  prontuarioId: string;
  profissionalId: string;
  tipo: string;
  descricao: string;
  registradoEm: Date;
  procedimentoId: string | null;
  evolucaoRetificadaId: string | null;
  motivoRetificacao: string | null;
}): Evolucao {
  return Evolucao.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    prontuarioId: row.prontuarioId,
    profissionalId: row.profissionalId,
    tipo: row.tipo as TipoEvolucao,
    descricao: row.descricao,
    registradoEm: row.registradoEm,
    procedimentoId: row.procedimentoId,
    evolucaoRetificadaId: row.evolucaoRetificadaId,
    motivoRetificacao: row.motivoRetificacao,
  });
}

function mapUniqueRetificacaoOrRethrow(
  error: unknown,
  evolucao: Evolucao,
): never {
  if (isUniqueViolationOnEvolucaoRetificada(error, evolucao)) {
    throw new EvolucaoJaRetificadaError(
      evolucao.evolucaoRetificadaId ?? evolucao.id,
    );
  }
  throw error;
}

/** PostgreSQL unique_violation = 23505. */
function isUniqueViolationOnEvolucaoRetificada(
  error: unknown,
  evolucao: Evolucao,
): boolean {
  // Só faz sentido mapear para "já retificada" em inserção de retificação.
  if (evolucao.evolucaoRetificadaId == null) return false;

  const candidates = collectErrorChain(error);
  for (const candidate of candidates) {
    if (candidate.code !== "23505") continue;
    const haystack = [
      candidate.constraint,
      candidate.constraint_name,
      candidate.detail,
      candidate.message,
    ]
      .filter((v): v is string => typeof v === "string")
      .join(" ")
      .toLowerCase();

    if (
      haystack.includes("evolucao_retificada_id") ||
      haystack.includes("evolucao_retificada_id_uidx")
    ) {
      return true;
    }

    // Evita confundir com UNIQUE do PK (`id`).
    if (haystack.includes("key (id)=") || haystack.includes("(id)=")) {
      continue;
    }

    // Race de retificação: único UNIQUE não-PK relevante nesta inserção.
    if (haystack.length === 0 || haystack.includes("evolucao")) {
      return true;
    }
  }
  return false;
}

function collectErrorChain(
  error: unknown,
): Array<{
  code?: unknown;
  constraint?: unknown;
  constraint_name?: unknown;
  detail?: unknown;
  message?: unknown;
  cause?: unknown;
}> {
  const out: Array<{
    code?: unknown;
    constraint?: unknown;
    constraint_name?: unknown;
    detail?: unknown;
    message?: unknown;
    cause?: unknown;
  }> = [];
  let current: unknown = error;
  for (let i = 0; i < 4 && current && typeof current === "object"; i++) {
    out.push(current as (typeof out)[number]);
    current = (current as { cause?: unknown }).cause;
  }
  return out;
}
