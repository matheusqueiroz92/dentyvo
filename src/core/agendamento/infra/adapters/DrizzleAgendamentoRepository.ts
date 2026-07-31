import { and, asc, eq, gte, gt, inArray, lt } from "drizzle-orm";

import type { AgendamentoRepositoryPort } from "../../application/ports/AgendamentoRepositoryPort";
import { Agendamento } from "../../domain/Agendamento";
import { SobreposicaoHorarioError } from "../../domain/errors";
import type {
  OrigemAgendamento,
  StatusAgendamento,
} from "../../domain/StatusAgendamento";
import type { db as Db } from "@/db";
import { agendamento as agendamentoTable } from "@/db/schema";

type Database = typeof Db;

const STATUS_OCUPANTES: StatusAgendamento[] = ["pendente", "confirmado"];

export class DrizzleAgendamentoRepository implements AgendamentoRepositoryPort {
  constructor(private readonly db: Database) {}

  async salvarOcupandoSlot(agendamento: Agendamento): Promise<void> {
    try {
      await this.db.insert(agendamentoTable).values(toRow(agendamento));
    } catch (error) {
      throw mapExclusionOrRethrow(error, agendamento);
    }
  }

  async remarcarAtomicamente(
    anterior: Agendamento,
    atualizado: Agendamento,
  ): Promise<void> {
    // Liberar o intervalo antigo e ocupar o novo na mesma transação:
    // se o INSERT falhar (ex.: EXCLUDE GiST), o DELETE é revertido e o
    // slot anterior permanece ocupado — sem estado inconsistente.
    await this.db.transaction(async (tx) => {
      await tx
        .delete(agendamentoTable)
        .where(
          and(
            eq(agendamentoTable.id, anterior.id),
            eq(agendamentoTable.clinicaId, anterior.clinicaId),
          ),
        );

      try {
        await tx.insert(agendamentoTable).values(toRow(atualizado));
      } catch (error) {
        throw mapExclusionOrRethrow(error, atualizado);
      }
    });
  }

  async salvar(agendamento: Agendamento): Promise<void> {
    await this.db
      .insert(agendamentoTable)
      .values(toRow(agendamento))
      .onConflictDoUpdate({
        target: agendamentoTable.id,
        set: {
          clinicaId: agendamento.clinicaId,
          pacienteId: agendamento.pacienteId,
          profissionalId: agendamento.profissionalId,
          procedimentoId: agendamento.procedimentoId,
          dataHoraInicio: agendamento.dataHoraInicio,
          dataHoraFim: agendamento.dataHoraFim,
          status: agendamento.status,
          origem: agendamento.origem,
          motivoCancelamento: agendamento.motivoCancelamento,
        },
      });
  }

  async buscarPorId(
    clinicaId: string,
    agendamentoId: string,
  ): Promise<Agendamento | null> {
    const row = await this.db.query.agendamento.findFirst({
      where: and(
        eq(agendamentoTable.id, agendamentoId),
        eq(agendamentoTable.clinicaId, clinicaId),
      ),
    });
    return row ? toDomain(row) : null;
  }

  async listarOcupadosPorProfissionalNoIntervalo(
    clinicaId: string,
    profissionalId: string,
    inicio: Date,
    fim: Date,
  ): Promise<Agendamento[]> {
    // Half-open overlap: inicio < fimExistente AND inicioExistente < fim
    const rows = await this.db
      .select()
      .from(agendamentoTable)
      .where(
        and(
          eq(agendamentoTable.clinicaId, clinicaId),
          eq(agendamentoTable.profissionalId, profissionalId),
          inArray(agendamentoTable.status, STATUS_OCUPANTES),
          lt(agendamentoTable.dataHoraInicio, fim),
          gt(agendamentoTable.dataHoraFim, inicio),
        ),
      );
    return rows.map(toDomain);
  }

  async listarPorPeriodo(
    clinicaId: string,
    dataInicio: Date,
    dataFim: Date,
    profissionalId?: string,
  ): Promise<Agendamento[]> {
    const condicoes = [
      eq(agendamentoTable.clinicaId, clinicaId),
      gte(agendamentoTable.dataHoraInicio, dataInicio),
      lt(agendamentoTable.dataHoraInicio, dataFim),
    ];
    if (profissionalId !== undefined) {
      condicoes.push(eq(agendamentoTable.profissionalId, profissionalId));
    }

    const rows = await this.db
      .select()
      .from(agendamentoTable)
      .where(and(...condicoes))
      .orderBy(asc(agendamentoTable.dataHoraInicio));

    return rows.map(toDomain);
  }
}

function toRow(agendamento: Agendamento) {
  return {
    id: agendamento.id,
    clinicaId: agendamento.clinicaId,
    pacienteId: agendamento.pacienteId,
    profissionalId: agendamento.profissionalId,
    procedimentoId: agendamento.procedimentoId,
    dataHoraInicio: agendamento.dataHoraInicio,
    dataHoraFim: agendamento.dataHoraFim,
    status: agendamento.status,
    origem: agendamento.origem,
    motivoCancelamento: agendamento.motivoCancelamento,
  };
}

function toDomain(row: {
  id: string;
  clinicaId: string;
  pacienteId: string;
  profissionalId: string;
  procedimentoId: string;
  dataHoraInicio: Date;
  dataHoraFim: Date;
  status: string;
  origem: string;
  motivoCancelamento: string | null;
}): Agendamento {
  return Agendamento.reconstituir({
    id: row.id,
    clinicaId: row.clinicaId,
    pacienteId: row.pacienteId,
    profissionalId: row.profissionalId,
    procedimentoId: row.procedimentoId,
    dataHoraInicio: row.dataHoraInicio,
    dataHoraFim: row.dataHoraFim,
    status: row.status as StatusAgendamento,
    origem: row.origem as OrigemAgendamento,
    motivoCancelamento: row.motivoCancelamento,
  });
}

function mapExclusionOrRethrow(
  error: unknown,
  agendamento: Agendamento,
): never {
  if (isExclusionViolation(error)) {
    throw new SobreposicaoHorarioError(
      agendamento.profissionalId,
      agendamento.dataHoraInicio,
      agendamento.dataHoraFim,
    );
  }
  throw error;
}

function isExclusionViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const withCode = error as { code?: unknown; cause?: unknown };
  if (withCode.code === "23P01") return true;
  if (withCode.cause && typeof withCode.cause === "object") {
    return (withCode.cause as { code?: unknown }).code === "23P01";
  }
  return false;
}
