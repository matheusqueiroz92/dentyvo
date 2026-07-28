import { FakeProfissionalRepository } from "@/core/auth/application/test-doubles/fakes";
import type { Papel } from "@/core/auth/domain/Papel";
import { Profissional } from "@/core/auth/domain/Profissional";

import { Prontuario } from "../../domain/Prontuario";
import {
  criarPacienteFake,
  FakeAuditoriaLogPort,
  FakeEvolucaoRepository,
  FakePacienteRepository,
  FakeProntuarioRepository,
} from "../test-doubles/fakes";

export async function seedContextoProntuario(papel: Papel = "dentista") {
  const profissionalRepo = new FakeProfissionalRepository();
  const pacienteRepo = new FakePacienteRepository();
  const prontuarioRepo = new FakeProntuarioRepository();
  const evolucaoRepo = new FakeEvolucaoRepository();
  const auditoria = new FakeAuditoriaLogPort();

  const profissional = Profissional.criar({
    id: `prof-${papel}`,
    clinicaId: "clinica-1",
    usuarioId: `user-${papel}`,
    nome: `Solicitante ${papel}`,
    papel,
    cro: papel === "dentista" ? "12345" : null,
  });
  await profissionalRepo.salvar(profissional);

  const paciente = criarPacienteFake({ id: "pac-1", clinicaId: "clinica-1" });
  await pacienteRepo.salvar(paciente);

  return {
    clinicaId: "clinica-1",
    solicitadoPorUsuarioId: profissional.usuarioId,
    profissional,
    profissionalRepo,
    pacienteRepo,
    prontuarioRepo,
    evolucaoRepo,
    auditoria,
    pacienteId: paciente.id,
  };
}

/** Semilha prontuário já existente na clínica do solicitante. */
export async function seedProntuarioExistente(papel: Papel = "dentista") {
  const ctx = await seedContextoProntuario(papel);
  const prontuario = Prontuario.criar({
    id: "pront-1",
    clinicaId: ctx.clinicaId,
    pacienteId: ctx.pacienteId,
  });
  await ctx.prontuarioRepo.salvar(prontuario);
  return { ...ctx, prontuario };
}
