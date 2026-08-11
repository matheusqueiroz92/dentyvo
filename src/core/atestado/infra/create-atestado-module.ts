import {
  DrizzleClinicaRepository,
  DrizzleProfissionalRepository,
} from "@/core/auth/infra/adapters";
import { DrizzlePacienteRepository } from "@/core/paciente/infra/adapters";
import { DrizzleProntuarioRepository } from "@/core/prontuario/infra/adapters";
import { PdfLibGeradorPdfPort } from "@/core/receituario/infra/adapters";
import { db } from "@/db";

import {
  EmitirAtestado,
  GerarPdfAtestado,
  ListarAtestadosDoProntuario,
} from "../application/use-cases";
import { DrizzleAtestadoRepository } from "./adapters";

/** Composition root do módulo atestado (spec 006b). */
export function createAtestadoModule() {
  const atestadoRepo = new DrizzleAtestadoRepository(db);
  const prontuarioRepo = new DrizzleProntuarioRepository(db);
  const clinicaRepo = new DrizzleClinicaRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const pacienteRepo = new DrizzlePacienteRepository(db);
  const geradorPdf = new PdfLibGeradorPdfPort();

  return {
    atestadoRepo,
    geradorPdf,
    emitirAtestado: new EmitirAtestado(
      atestadoRepo,
      prontuarioRepo,
      clinicaRepo,
      profissionalRepo,
      pacienteRepo,
    ),
    listarAtestadosDoProntuario: new ListarAtestadosDoProntuario(
      atestadoRepo,
      prontuarioRepo,
      profissionalRepo,
    ),
    gerarPdfAtestado: new GerarPdfAtestado(
      atestadoRepo,
      geradorPdf,
      profissionalRepo,
    ),
  };
}
