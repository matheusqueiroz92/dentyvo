import { db } from "@/db";
import { DrizzleProfissionalRepository } from "@/core/auth/infra/adapters";
import {
  DrizzleAuditoriaLogPort,
  DrizzleProntuarioRepository,
} from "@/core/prontuario/infra/adapters";

import { DrizzleAnamneseRepository } from "./adapters";

/** Composition root do módulo anamnese. */
export function createAnamneseModule() {
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const prontuarioRepo = new DrizzleProntuarioRepository(db);
  const anamneseRepo = new DrizzleAnamneseRepository(db);
  const auditoria = new DrizzleAuditoriaLogPort(db);

  return {
    profissionalRepo,
    prontuarioRepo,
    anamneseRepo,
    auditoria,
  };
}
