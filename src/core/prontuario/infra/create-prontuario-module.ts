import { db } from "@/db";
import { DrizzleProfissionalRepository } from "@/core/auth/infra/adapters";
import { DrizzlePacienteRepository } from "@/core/paciente/infra/adapters";

import {
  DrizzleAuditoriaLogPort,
  DrizzleEvolucaoRepository,
  DrizzleProntuarioRepository,
} from "./adapters";

/** Composition root do módulo prontuário. */
export function createProntuarioModule() {
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const pacienteRepo = new DrizzlePacienteRepository(db);
  const prontuarioRepo = new DrizzleProntuarioRepository(db);
  const evolucaoRepo = new DrizzleEvolucaoRepository(db);
  const auditoria = new DrizzleAuditoriaLogPort(db);

  return {
    profissionalRepo,
    pacienteRepo,
    prontuarioRepo,
    evolucaoRepo,
    auditoria,
  };
}
