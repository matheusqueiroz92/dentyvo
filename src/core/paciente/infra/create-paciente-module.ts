import { db } from "@/db";
import { DrizzleProfissionalRepository } from "@/core/auth/infra/adapters";

import { DrizzlePacienteRepository } from "./adapters";

/** Composition root do módulo paciente. */
export function createPacienteModule() {
  const pacienteRepo = new DrizzlePacienteRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);

  return {
    pacienteRepo,
    profissionalRepo,
  };
}
