import { randomUUID } from "node:crypto";

import type {
  IntencaoLembrete,
  LembretePort,
} from "../../application/ports/LembretePort";
import type { db as Db } from "@/db";
import { lembreteIntencao as lembreteTable } from "@/db/schema";

type Database = typeof Db;

/**
 * Stub de lembrete: persiste intenção de envio (sem job real).
 */
export class DrizzleLembretePort implements LembretePort {
  constructor(private readonly db: Database) {}

  async registrarIntencao(intencao: IntencaoLembrete): Promise<void> {
    await this.db
      .insert(lembreteTable)
      .values({
        id: randomUUID(),
        agendamentoId: intencao.agendamentoId,
        clinicaId: intencao.clinicaId,
        pacienteId: intencao.pacienteId,
        profissionalId: intencao.profissionalId,
        dataHoraConsulta: intencao.dataHoraConsulta,
        dataHoraEnvioPrevisto: intencao.dataHoraEnvioPrevisto,
      })
      .onConflictDoUpdate({
        target: lembreteTable.agendamentoId,
        set: {
          dataHoraConsulta: intencao.dataHoraConsulta,
          dataHoraEnvioPrevisto: intencao.dataHoraEnvioPrevisto,
          pacienteId: intencao.pacienteId,
          profissionalId: intencao.profissionalId,
        },
      });
  }
}
