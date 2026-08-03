"use server";

import { z } from "zod";

import { CancelarConsulta } from "@/core/agendamento/application/use-cases/CancelarConsulta";
import { ConfirmarConsulta } from "@/core/agendamento/application/use-cases/ConfirmarConsulta";
import { ListarAgendamentosDoPeriodo } from "@/core/agendamento/application/use-cases/ListarAgendamentosDoPeriodo";
import { ListarProcedimentos } from "@/core/agendamento/application/use-cases/ListarProcedimentos";
import { MarcarConsulta } from "@/core/agendamento/application/use-cases/MarcarConsulta";
import { RemarcarConsulta } from "@/core/agendamento/application/use-cases/RemarcarConsulta";
import { createAgendamentoModule } from "@/core/agendamento/infra/create-agendamento-module";
import { ListarMembrosDaClinica } from "@/core/auth/application/use-cases/ListarMembrosDaClinica";
import { ObterContextoSessao } from "@/core/auth/application/use-cases/ObterContextoSessao";
import { createAuthModule } from "@/core/auth/infra/create-auth-module";
import { ListarPacientes } from "@/core/paciente/application/use-cases/ListarPacientes";
import { createPacienteModule } from "@/core/paciente/infra/create-paciente-module";
import type { AgendamentoAgendaDTO, OpcaoSelect } from "@/lib/agenda/types";
import { actionClient } from "@/lib/safe-action";

async function exigirSessao() {
  const auth = createAuthModule();
  const ctx = await new ObterContextoSessao(auth.authPort).executar();
  if (!ctx) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return ctx;
}

function mapearAgendamento(
  a: {
    id: string;
    dataHoraInicio: Date;
    dataHoraFim: Date;
    pacienteId: string;
    profissionalId: string;
    procedimentoId: string;
    status: AgendamentoAgendaDTO["status"];
    origem: string;
    motivoCancelamento: string | null;
  },
  nomes: {
    paciente: string;
    profissional: string;
    procedimento: string;
  },
): AgendamentoAgendaDTO {
  return {
    id: a.id,
    dataHoraInicioIso: a.dataHoraInicio.toISOString(),
    dataHoraFimIso: a.dataHoraFim.toISOString(),
    pacienteId: a.pacienteId,
    pacienteNome: nomes.paciente,
    profissionalId: a.profissionalId,
    profissionalNome: nomes.profissional,
    procedimentoId: a.procedimentoId,
    procedimentoNome: nomes.procedimento,
    status: a.status,
    origem: a.origem,
    motivoCancelamento: a.motivoCancelamento,
  };
}

async function enriquecerUm(
  clinicaId: string,
  a: {
    id: string;
    dataHoraInicio: Date;
    dataHoraFim: Date;
    pacienteId: string;
    profissionalId: string;
    procedimentoId: string;
    status: AgendamentoAgendaDTO["status"];
    origem: string;
    motivoCancelamento: string | null;
  },
): Promise<AgendamentoAgendaDTO> {
  const mod = createAgendamentoModule();
  const [paciente, profissional, procedimento] = await Promise.all([
    mod.pacienteRepo.buscarPorId(clinicaId, a.pacienteId),
    mod.profissionalRepo.buscarPorId(clinicaId, a.profissionalId),
    mod.procedimentoRepo.buscarPorId(clinicaId, a.procedimentoId),
  ]);
  return mapearAgendamento(a, {
    paciente: paciente?.nome ?? "Paciente",
    profissional: profissional?.nome ?? "Profissional",
    procedimento: procedimento?.nome ?? "Procedimento",
  });
}

export const listarAgendamentosPeriodoAction = actionClient
  .inputSchema(
    z.object({
      dataInicioIso: z.string().datetime(),
      dataFimIso: z.string().datetime(),
      profissionalId: z.string().uuid().optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<AgendamentoAgendaDTO[]> => {
    const sessao = await exigirSessao();
    const mod = createAgendamentoModule();
    const lista = await new ListarAgendamentosDoPeriodo(
      mod.agendamentoRepo,
      mod.profissionalRepo,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      dataInicio: new Date(parsedInput.dataInicioIso),
      dataFim: new Date(parsedInput.dataFimIso),
      profissionalId: parsedInput.profissionalId,
    });

    return Promise.all(
      lista.map((a) => enriquecerUm(sessao.clinicaId, a)),
    );
  });

export const marcarConsultaAction = actionClient
  .inputSchema(
    z.object({
      pacienteId: z.string().uuid(),
      profissionalId: z.string().uuid(),
      procedimentoId: z.string().uuid(),
      dataHoraInicioIso: z.string().datetime(),
      duracaoMinutos: z.number().int().min(15).max(240).optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<AgendamentoAgendaDTO> => {
    const sessao = await exigirSessao();
    const mod = createAgendamentoModule();
    const criado = await new MarcarConsulta(
      mod.agendamentoRepo,
      mod.disponibilidadeRepo,
      mod.procedimentoRepo,
      mod.pacienteRepo,
      mod.profissionalRepo,
      mod.lembrete,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      pacienteId: parsedInput.pacienteId,
      profissionalId: parsedInput.profissionalId,
      procedimentoId: parsedInput.procedimentoId,
      dataHoraInicio: new Date(parsedInput.dataHoraInicioIso),
      origem: "painel",
      duracaoMinutos: parsedInput.duracaoMinutos,
    });
    return enriquecerUm(sessao.clinicaId, criado);
  });

export const remarcarConsultaAction = actionClient
  .inputSchema(
    z.object({
      agendamentoId: z.string().uuid(),
      novaDataHoraInicioIso: z.string().datetime(),
      duracaoMinutos: z.number().int().min(15).max(240).optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<AgendamentoAgendaDTO> => {
    const sessao = await exigirSessao();
    const mod = createAgendamentoModule();
    const atualizado = await new RemarcarConsulta(
      mod.agendamentoRepo,
      mod.disponibilidadeRepo,
      mod.profissionalRepo,
      mod.lembrete,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      agendamentoId: parsedInput.agendamentoId,
      novaDataHoraInicio: new Date(parsedInput.novaDataHoraInicioIso),
      duracaoMinutos: parsedInput.duracaoMinutos,
    });
    return enriquecerUm(sessao.clinicaId, atualizado);
  });

export const cancelarConsultaAction = actionClient
  .inputSchema(
    z.object({
      agendamentoId: z.string().uuid(),
      motivo: z.string().max(500).optional(),
    }),
  )
  .action(async ({ parsedInput }): Promise<{ ok: true }> => {
    const sessao = await exigirSessao();
    const mod = createAgendamentoModule();
    await new CancelarConsulta(
      mod.agendamentoRepo,
      mod.profissionalRepo,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      agendamentoId: parsedInput.agendamentoId,
      motivo: parsedInput.motivo,
    });
    return { ok: true };
  });

export const confirmarConsultaAction = actionClient
  .inputSchema(
    z.object({
      agendamentoId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }): Promise<AgendamentoAgendaDTO> => {
    const sessao = await exigirSessao();
    const mod = createAgendamentoModule();
    const atualizado = await new ConfirmarConsulta(
      mod.agendamentoRepo,
      mod.profissionalRepo,
    ).executar({
      clinicaId: sessao.clinicaId,
      solicitadoPorUsuarioId: sessao.usuarioId,
      agendamentoId: parsedInput.agendamentoId,
    });
    return enriquecerUm(sessao.clinicaId, atualizado);
  });

export const listarOpcoesAgendaAction = actionClient.action(
  async (): Promise<{
    pacientes: OpcaoSelect[];
    profissionais: OpcaoSelect[];
    procedimentos: OpcaoSelect[];
  }> => {
    const sessao = await exigirSessao();
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
  },
);
