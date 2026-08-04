import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { HorarioDisponivel } from "../../domain/DisponibilidadeProfissional";
import type { AgendamentoRepositoryPort } from "../ports/AgendamentoRepositoryPort";
import type { DisponibilidadeProfissionalRepositoryPort } from "../ports/DisponibilidadeProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";
import { ListarHorariosDisponiveisCore } from "./listarHorariosDisponiveisCore";

export type ListarHorariosDisponiveisInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  profissionalId: string;
  /** Dia civil no timezone operacional (hora local irrelevante; usa-se a data). */
  data: Date;
};

/**
 * Porta autenticada: valida sessão/RBAC e delega ao
 * {@link ListarHorariosDisponiveisCore}.
 */
export class ListarHorariosDisponiveis {
  private readonly core: ListarHorariosDisponiveisCore;

  constructor(
    disponibilidadeRepo: DisponibilidadeProfissionalRepositoryPort,
    agendamentoRepo: AgendamentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {
    this.core = new ListarHorariosDisponiveisCore(
      disponibilidadeRepo,
      agendamentoRepo,
      profissionalRepo,
    );
  }

  async executar(
    input: ListarHorariosDisponiveisInput,
  ): Promise<HorarioDisponivel[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_horarios_disponiveis");

    return this.core.executar({
      clinicaId: input.clinicaId,
      profissionalId: input.profissionalId,
      data: input.data,
    });
  }
}
