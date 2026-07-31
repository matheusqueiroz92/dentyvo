import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { Agendamento } from "../../domain/Agendamento";
import type { AgendamentoRepositoryPort } from "../ports/AgendamentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarAgendamentosDoPeriodoInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  dataInicio: Date;
  dataFim: Date;
  profissionalId?: string;
};

/**
 * Lista agendamentos do período half-open `[dataInicio, dataFim)` (filtro em
 * `dataHoraInicio`), com `profissionalId` opcional, escopado por `clinicaId`.
 * RBAC: admin | dentista | recepcao (spec 002).
 */
export class ListarAgendamentosDoPeriodo {
  constructor(
    private readonly agendamentoRepo: AgendamentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ListarAgendamentosDoPeriodoInput,
  ): Promise<Agendamento[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_agendamentos_do_periodo");

    return this.agendamentoRepo.listarPorPeriodo(
      input.clinicaId,
      input.dataInicio,
      input.dataFim,
      input.profissionalId,
    );
  }
}
