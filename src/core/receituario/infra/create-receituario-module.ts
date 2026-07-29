import {
  DrizzleClinicaRepository,
  DrizzleProfissionalRepository,
} from "@/core/auth/infra/adapters";
import { DrizzlePacienteRepository } from "@/core/paciente/infra/adapters";
import { DrizzleProntuarioRepository } from "@/core/prontuario/infra/adapters";
import { db } from "@/db";

import {
  EmitirReceita,
  GerarPdfReceita,
  ListarReceitasDoProntuario,
} from "../application/use-cases";
import { DrizzleReceitaRepository, PdfLibGeradorPdfPort } from "./adapters";

/** Composition root do módulo receituário (spec 006). */
export function createReceituarioModule() {
  const receitaRepo = new DrizzleReceitaRepository(db);
  const prontuarioRepo = new DrizzleProntuarioRepository(db);
  const clinicaRepo = new DrizzleClinicaRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const pacienteRepo = new DrizzlePacienteRepository(db);
  const geradorPdf = new PdfLibGeradorPdfPort();

  return {
    receitaRepo,
    geradorPdf,
    emitirReceita: new EmitirReceita(
      receitaRepo,
      prontuarioRepo,
      clinicaRepo,
      profissionalRepo,
      pacienteRepo,
    ),
    listarReceitasDoProntuario: new ListarReceitasDoProntuario(
      receitaRepo,
      prontuarioRepo,
      profissionalRepo,
    ),
    gerarPdfReceita: new GerarPdfReceita(
      receitaRepo,
      geradorPdf,
      profissionalRepo,
    ),
  };
}
