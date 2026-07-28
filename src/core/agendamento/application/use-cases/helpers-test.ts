import { FakeProfissionalRepository } from "@/core/auth/application/test-doubles/fakes";
import { Profissional } from "@/core/auth/domain/Profissional";
import type { Papel } from "@/core/auth/domain/Papel";
import { FakePacienteRepository } from "@/core/paciente/application/test-doubles/fakes";
import { Paciente } from "@/core/paciente/domain/Paciente";

import { DisponibilidadeProfissional } from "../../domain/DisponibilidadeProfissional";
import { Procedimento } from "../../domain/Procedimento";
import {
  FakeAgendamentoRepository,
  FakeDisponibilidadeRepository,
  FakeLembretePort,
  FakeProcedimentoRepository,
} from "../test-doubles/fakes";

export const CPF_PACIENTE = "39053344705";

/**
 * Prepara clínica com dentista alvo `prof-1`, paciente, procedimento e
 * janelas seg 08–12 / 14–18. O solicitante segue o `papel` informado.
 */
export async function seedContextoAgendamento(papel: Papel = "recepcao") {
  const profissionalRepo = new FakeProfissionalRepository();
  const pacienteRepo = new FakePacienteRepository();
  const agendamentoRepo = new FakeAgendamentoRepository();
  const disponibilidadeRepo = new FakeDisponibilidadeRepository();
  const procedimentoRepo = new FakeProcedimentoRepository();
  const lembrete = new FakeLembretePort();
  const clinicaId = "clinica-1";

  const dentista = Profissional.criar({
    id: "prof-1",
    clinicaId,
    usuarioId: "user-dentista-alvo",
    nome: "Dr. Agenda",
    papel: "dentista",
    cro: "99999",
  });
  await profissionalRepo.salvar(dentista);

  let solicitadoPorUsuarioId = dentista.usuarioId;
  if (papel !== "dentista") {
    const solicitante = Profissional.criar({
      id: `prof-${papel}`,
      clinicaId,
      usuarioId: `user-${papel}`,
      nome: `Solicitante ${papel}`,
      papel,
    });
    await profissionalRepo.salvar(solicitante);
    solicitadoPorUsuarioId = solicitante.usuarioId;
  }

  const paciente = Paciente.criar({
    id: "pac-1",
    clinicaId,
    nome: "Paciente Teste",
    cpf: CPF_PACIENTE,
    telefone: "77999990000",
    dataNascimento: new Date("1990-01-01T12:00:00.000Z"),
  });
  await pacienteRepo.salvar(paciente);

  const procedimento = Procedimento.criar({
    id: "proc-1",
    clinicaId,
    nome: "Consulta",
    duracaoPadraoMinutos: 60,
    valor: 100,
  });
  await procedimentoRepo.salvar(procedimento);

  await disponibilidadeRepo.substituirJanelas(clinicaId, "prof-1", [
    DisponibilidadeProfissional.criar({
      id: "jan-manha",
      clinicaId,
      profissionalId: "prof-1",
      diaDaSemana: 1,
      horaInicio: "08:00",
      horaFim: "12:00",
    }),
    DisponibilidadeProfissional.criar({
      id: "jan-tarde",
      clinicaId,
      profissionalId: "prof-1",
      diaDaSemana: 1,
      horaInicio: "14:00",
      horaFim: "18:00",
    }),
  ]);

  return {
    clinicaId,
    solicitadoPorUsuarioId,
    profissionalId: "prof-1",
    pacienteId: paciente.id,
    procedimentoId: procedimento.id,
    profissionalRepo,
    pacienteRepo,
    agendamentoRepo,
    disponibilidadeRepo,
    procedimentoRepo,
    lembrete,
  };
}

/** Segunda-feira 2026-07-27 no fuso America/Sao_Paulo (UTC-3). */
export function segundaAs(horaLocal: number, minutoLocal = 0): Date {
  return new Date(Date.UTC(2026, 6, 27, horaLocal + 3, minutoLocal, 0));
}
