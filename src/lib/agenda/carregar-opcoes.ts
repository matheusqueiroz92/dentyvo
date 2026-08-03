import { ListarProcedimentos } from "@/core/agendamento/application/use-cases/ListarProcedimentos";
import { createAgendamentoModule } from "@/core/agendamento/infra/create-agendamento-module";
import { ListarMembrosDaClinica } from "@/core/auth/application/use-cases/ListarMembrosDaClinica";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { ListarPacientes } from "@/core/paciente/application/use-cases/ListarPacientes";
import { createPacienteModule } from "@/core/paciente/infra/create-paciente-module";
import { requireSessaoClinica } from "@/lib/dashboard/obter-sessao-clinica";

import type { OpcaoSelect } from "./types";

export async function carregarOpcoesAgenda(): Promise<{
  pacientes: OpcaoSelect[];
  profissionais: OpcaoSelect[];
  procedimentos: OpcaoSelect[];
}> {
  const sessao = await requireSessaoClinica();
  const auth = createAuthModule();
  const pacienteMod = createPacienteModule();
  const agendamentoMod = createAgendamentoModule();

  const [pacientes, membros, procedimentos] = await Promise.all([
    new ListarPacientes(
      pacienteMod.pacienteRepo,
      pacienteMod.profissionalRepo,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
    }),
    new ListarMembrosDaClinica(
      auth.profissionalRepo,
      auth.authPort,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
    }),
    new ListarProcedimentos(
      agendamentoMod.procedimentoRepo,
      agendamentoMod.profissionalRepo,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
    }),
  ]);

  return {
    pacientes: pacientes.map((p) => ({ id: p.id, label: p.nome })),
    profissionais: membros.map((m) => ({ id: m.id, label: m.nome })),
    procedimentos: procedimentos.map((p) => ({ id: p.id, label: p.nome })),
  };
}
