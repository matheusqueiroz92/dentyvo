import { ListarAgendamentosDoPeriodo } from "@/core/agendamento/application/use-cases/ListarAgendamentosDoPeriodo";
import { createAgendamentoModule } from "@/core/agendamento/infra/create-agendamento-module";
import { requireSessaoClinica } from "@/lib/dashboard/obter-sessao-clinica";

import type { AgendamentoAgendaDTO } from "./types";

export async function carregarAgendamentosDoPeriodo(input: {
  dataInicio: Date;
  dataFim: Date;
  profissionalId?: string;
}): Promise<AgendamentoAgendaDTO[]> {
  const sessao = await requireSessaoClinica();
  const mod = createAgendamentoModule();

  const agendamentos = await new ListarAgendamentosDoPeriodo(
    mod.agendamentoRepo,
    mod.profissionalRepo,
  ).executar({
    clinicaId: sessao.clinicaId,
    solicitadoPorUsuarioId: sessao.usuarioId,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    profissionalId: input.profissionalId,
  });

  const pacienteIds = [...new Set(agendamentos.map((a) => a.pacienteId))];
  const profissionalIds = [
    ...new Set(agendamentos.map((a) => a.profissionalId)),
  ];
  const procedimentoIds = [
    ...new Set(agendamentos.map((a) => a.procedimentoId)),
  ];

  const [pacientes, profissionais, procedimentos] = await Promise.all([
    Promise.all(
      pacienteIds.map((id) =>
        mod.pacienteRepo.buscarPorId(sessao.clinicaId, id),
      ),
    ),
    Promise.all(
      profissionalIds.map((id) =>
        mod.profissionalRepo.buscarPorId(sessao.clinicaId, id),
      ),
    ),
    Promise.all(
      procedimentoIds.map((id) =>
        mod.procedimentoRepo.buscarPorId(sessao.clinicaId, id),
      ),
    ),
  ]);

  const nomePaciente = new Map(
    pacientes
      .filter((p): p is NonNullable<typeof p> => p != null)
      .map((p) => [p.id, p.nome]),
  );
  const nomeProfissional = new Map(
    profissionais
      .filter((p): p is NonNullable<typeof p> => p != null)
      .map((p) => [p.id, p.nome]),
  );
  const nomeProcedimento = new Map(
    procedimentos
      .filter((p): p is NonNullable<typeof p> => p != null)
      .map((p) => [p.id, p.nome]),
  );

  return agendamentos.map((a) => ({
    id: a.id,
    dataHoraInicioIso: a.dataHoraInicio.toISOString(),
    dataHoraFimIso: a.dataHoraFim.toISOString(),
    pacienteId: a.pacienteId,
    pacienteNome: nomePaciente.get(a.pacienteId) ?? "Paciente",
    profissionalId: a.profissionalId,
    profissionalNome: nomeProfissional.get(a.profissionalId) ?? "Profissional",
    procedimentoId: a.procedimentoId,
    procedimentoNome: nomeProcedimento.get(a.procedimentoId) ?? "Procedimento",
    status: a.status,
    origem: a.origem,
    motivoCancelamento: a.motivoCancelamento,
  }));
}
