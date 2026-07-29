import {
  FakeClinicaRepository,
  FakeProfissionalRepository,
} from "@/core/auth/application/test-doubles/fakes";
import { Clinica } from "@/core/auth/domain/Clinica";
import { DocumentoFiscal } from "@/core/auth/domain/DocumentoFiscal";
import type { Papel } from "@/core/auth/domain/Papel";
import { Profissional } from "@/core/auth/domain/Profissional";
import {
  criarPacienteFake,
  FakePacienteRepository,
  FakeProntuarioRepository,
} from "@/core/prontuario/application/test-doubles/fakes";
import { Prontuario } from "@/core/prontuario/domain/Prontuario";

import { FakeGeradorPdfPort, FakeReceitaRepository } from "../test-doubles/fakes";

const CPF_CLINICA = "39053344705";

/**
 * Seed multi-tenant com clínica, profissional, paciente e prontuário.
 * Reaproveita fakes de 001/002/003 — não redefine ports alheias.
 */
export async function seedContextoReceituario(papel: Papel = "dentista") {
  const clinicaRepo = new FakeClinicaRepository();
  const profissionalRepo = new FakeProfissionalRepository();
  const pacienteRepo = new FakePacienteRepository();
  const prontuarioRepo = new FakeProntuarioRepository();
  const receitaRepo = new FakeReceitaRepository();
  const geradorPdf = new FakeGeradorPdfPort();

  const clinica = Clinica.criar({
    id: "clinica-1",
    nome: "Clínica Sorriso",
    endereco: "Rua A, 100",
    documento: DocumentoFiscal.criar("cpf", CPF_CLINICA),
  });
  await clinicaRepo.salvar(clinica);

  const profissional = Profissional.criar({
    id: `prof-${papel}`,
    clinicaId: clinica.id,
    usuarioId: `user-${papel}`,
    nome: `Solicitante ${papel}`,
    papel,
    cro: papel === "dentista" ? "12345" : null,
    especialidade: papel === "dentista" ? "Ortodontia" : null,
  });
  await profissionalRepo.salvar(profissional);

  const paciente = criarPacienteFake({ id: "pac-1", clinicaId: clinica.id });
  await pacienteRepo.salvar(paciente);

  const prontuario = Prontuario.criar({
    id: "pront-1",
    clinicaId: clinica.id,
    pacienteId: paciente.id,
  });
  await prontuarioRepo.salvar(prontuario);

  return {
    clinicaId: clinica.id,
    clinica,
    solicitadoPorUsuarioId: profissional.usuarioId,
    profissional,
    profissionalRepo,
    clinicaRepo,
    pacienteRepo,
    prontuarioRepo,
    receitaRepo,
    geradorPdf,
    paciente,
    prontuario,
  };
}
