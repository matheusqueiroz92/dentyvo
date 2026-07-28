import { db } from "@/db";
import { DrizzleProfissionalRepository } from "@/core/auth/infra/adapters";
import { DrizzlePacienteRepository } from "@/core/paciente/infra/adapters";

import {
  DrizzleAgendamentoRepository,
  DrizzleDisponibilidadeProfissionalRepository,
  DrizzleLembretePort,
  DrizzleProcedimentoRepository,
} from "./adapters";

/** Composition root do módulo agendamento. */
export function createAgendamentoModule() {
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const pacienteRepo = new DrizzlePacienteRepository(db);
  const agendamentoRepo = new DrizzleAgendamentoRepository(db);
  const disponibilidadeRepo = new DrizzleDisponibilidadeProfissionalRepository(
    db,
  );
  const procedimentoRepo = new DrizzleProcedimentoRepository(db);
  const lembrete = new DrizzleLembretePort(db);

  return {
    profissionalRepo,
    pacienteRepo,
    agendamentoRepo,
    disponibilidadeRepo,
    procedimentoRepo,
    lembrete,
  };
}
