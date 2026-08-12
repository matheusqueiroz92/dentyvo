import { DrizzleProcedimentoRepository } from "@/core/agendamento/infra/adapters";
import {
  DrizzleClinicaRepository,
  DrizzleProfissionalRepository,
} from "@/core/auth/infra/adapters";
import { DrizzlePacienteRepository } from "@/core/paciente/infra/adapters";
import { DrizzleProntuarioRepository } from "@/core/prontuario/infra/adapters";
import { PdfLibGeradorPdfPort } from "@/core/receituario/infra/adapters";
import { db } from "@/db";

import {
  AceitarOrcamento,
  EmitirOrcamento,
  GerarPdfOrcamento,
  ListarOrcamentosDoProntuario,
  RecusarOrcamento,
} from "../application/use-cases";
import { DrizzleOrcamentoRepository } from "./adapters";

/** Composition root do módulo orçamento (spec 015). */
export function createOrcamentoModule() {
  const orcamentoRepo = new DrizzleOrcamentoRepository(db);
  const prontuarioRepo = new DrizzleProntuarioRepository(db);
  const clinicaRepo = new DrizzleClinicaRepository(db);
  const profissionalRepo = new DrizzleProfissionalRepository(db);
  const pacienteRepo = new DrizzlePacienteRepository(db);
  const procedimentoRepo = new DrizzleProcedimentoRepository(db);
  const geradorPdf = new PdfLibGeradorPdfPort();

  return {
    orcamentoRepo,
    geradorPdf,
    emitirOrcamento: new EmitirOrcamento(
      orcamentoRepo,
      prontuarioRepo,
      clinicaRepo,
      profissionalRepo,
      pacienteRepo,
      procedimentoRepo,
    ),
    listarOrcamentosDoProntuario: new ListarOrcamentosDoProntuario(
      orcamentoRepo,
      profissionalRepo,
    ),
    aceitarOrcamento: new AceitarOrcamento(orcamentoRepo, profissionalRepo),
    recusarOrcamento: new RecusarOrcamento(orcamentoRepo, profissionalRepo),
    gerarPdfOrcamento: new GerarPdfOrcamento(
      orcamentoRepo,
      geradorPdf,
      profissionalRepo,
    ),
  };
}
