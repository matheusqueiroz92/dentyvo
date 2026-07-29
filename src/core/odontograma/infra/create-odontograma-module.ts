import { DrizzleProfissionalRepository } from "@/core/auth/infra/adapters";
import { DrizzleProntuarioRepository } from "@/core/prontuario/infra/adapters";
import { db } from "@/db";

import {
  ConsultarOdontogramaVigente,
  ListarHistoricoOdontograma,
  RegistrarEventosOdontograma,
} from "../application/use-cases";
import { DrizzleOdontogramaRepository } from "./adapters";

/** Composition root do módulo odontograma (spec 004). */
export function createOdontogramaModule() {
  const odontogramaRepo = new DrizzleOdontogramaRepository(db);
  const prontuarioRepo = new DrizzleProntuarioRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);

  return {
    odontogramaRepo,
    registrarEventosOdontograma: new RegistrarEventosOdontograma(
      odontogramaRepo,
      prontuarioRepo,
      profissionalRepo,
    ),
    consultarOdontogramaVigente: new ConsultarOdontogramaVigente(
      odontogramaRepo,
      prontuarioRepo,
      profissionalRepo,
    ),
    listarHistoricoOdontograma: new ListarHistoricoOdontograma(
      odontogramaRepo,
      prontuarioRepo,
      profissionalRepo,
    ),
  };
}
