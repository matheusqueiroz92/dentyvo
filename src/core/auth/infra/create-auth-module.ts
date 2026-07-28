import { db } from "@/db";

import {
  BetterAuthAuthPort,
  ConsoleEmailPort,
  DrizzleClinicaRepository,
  DrizzleConviteRepository,
  DrizzleProfissionalRepository,
} from "./adapters";

/** Composition root do módulo auth (injeta adapters nas ports). */
export function createAuthModule() {
  const clinicaRepo = new DrizzleClinicaRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const conviteRepo = new DrizzleConviteRepository(db);
  const email = new ConsoleEmailPort();
  const authPort = new BetterAuthAuthPort(db, profissionalRepo);

  return {
    clinicaRepo,
    profissionalRepo,
    conviteRepo,
    email,
    authPort,
  };
}
