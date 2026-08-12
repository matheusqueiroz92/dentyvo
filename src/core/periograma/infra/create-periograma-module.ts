import { DrizzleProfissionalRepository } from "@/core/auth/infra/adapters";
import { DrizzleProntuarioRepository } from "@/core/prontuario/infra/adapters";
import { db } from "@/db";

import {
  ConsultarPeriograma,
  ListarPeriogramasDoProntuario,
  RegistrarPeriograma,
} from "../application/use-cases";
import { DrizzlePeriogramaRepository } from "./adapters";

/** Composition root do módulo periograma (spec 005). */
export function createPeriogramaModule() {
  const periogramaRepo = new DrizzlePeriogramaRepository(db);
  const prontuarioRepo = new DrizzleProntuarioRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);

  return {
    periogramaRepo,
    profissionalRepo,
    registrarPeriograma: new RegistrarPeriograma(
      periogramaRepo,
      prontuarioRepo,
      profissionalRepo,
    ),
    consultarPeriograma: new ConsultarPeriograma(
      periogramaRepo,
      profissionalRepo,
    ),
    listarPeriogramasDoProntuario: new ListarPeriogramasDoProntuario(
      periogramaRepo,
      prontuarioRepo,
      profissionalRepo,
    ),
  };
}
