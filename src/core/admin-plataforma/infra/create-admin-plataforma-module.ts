import { db } from "@/db";
import {
  DrizzleClinicaRepository,
  DrizzleProfissionalRepository,
  BetterAuthAuthPort,
} from "@/core/auth/infra/adapters";
import { DrizzleAuditoriaLogPort } from "@/core/prontuario/infra/adapters";

import { DrizzleUsuarioPlataformaRepository } from "./adapters";

/** Composition root do módulo admin-plataforma (spec 009). */
export function createAdminPlataformaModule() {
  const clinicaRepo = new DrizzleClinicaRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const usuarioPlataformaRepo = new DrizzleUsuarioPlataformaRepository(db);
  const auth = new BetterAuthAuthPort(db, profissionalRepo);
  const auditoria = new DrizzleAuditoriaLogPort(db);

  return {
    clinicaRepo,
    profissionalRepo,
    usuarioPlataformaRepo,
    auth,
    auditoria,
  };
}
