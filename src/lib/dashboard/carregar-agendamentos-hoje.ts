import { cache } from "react";

import { ListarAgendamentosDoPeriodo } from "@/core/agendamento/application/use-cases/ListarAgendamentosDoPeriodo";
import { createAgendamentoModule } from "@/core/agendamento/infra/create-agendamento-module";
import { periodoDoDia } from "@/lib/periodo-dia";

import { requireSessaoClinica } from "./obter-sessao-clinica";
import type {
  AgendamentoDashboardDTO,
  ResultadoBloco,
} from "./types";

/**
 * Lista agendamentos de hoje (timezone operacional), enriquecidos com nomes.
 * `cache` evita fetch duplicado entre Agenda do dia e Confirmações pendentes.
 */
export const carregarAgendamentosHoje = cache(
  async (): Promise<ResultadoBloco<AgendamentoDashboardDTO[]>> => {
    const sessao = await requireSessaoClinica();

    try {
      const mod = createAgendamentoModule();
      const { dataInicio, dataFim } = periodoDoDia();

      const agendamentos = await new ListarAgendamentosDoPeriodo(
        mod.agendamentoRepo,
        mod.profissionalRepo,
      ).executar({
        clinicaId: sessao.clinicaId,
        solicitadoPorUsuarioId: sessao.usuarioId,
        dataInicio,
        dataFim,
      });

      const pacienteIds = [...new Set(agendamentos.map((a) => a.pacienteId))];
      const profissionalIds = [
        ...new Set(agendamentos.map((a) => a.profissionalId)),
      ];

      const [pacientes, profissionais] = await Promise.all([
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

      const data: AgendamentoDashboardDTO[] = agendamentos.map((a) => ({
        id: a.id,
        dataHoraInicioIso: a.dataHoraInicio.toISOString(),
        pacienteNome: nomePaciente.get(a.pacienteId) ?? "Paciente",
        profissionalNome:
          nomeProfissional.get(a.profissionalId) ?? "Profissional",
        status: a.status,
      }));

      return { ok: true, data };
    } catch (error) {
      console.error("[dashboard] carregarAgendamentosHoje", error);
      return {
        ok: false,
        mensagem:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a agenda do dia.",
      };
    }
  },
);
