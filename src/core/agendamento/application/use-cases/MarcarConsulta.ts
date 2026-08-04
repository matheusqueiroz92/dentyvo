import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { PacienteRepositoryPort } from "@/core/paciente/application/ports/PacienteRepositoryPort";

import type { Agendamento } from "../../domain/Agendamento";
import type { OrigemAgendamento } from "../../domain/StatusAgendamento";
import type { AgendamentoRepositoryPort } from "../ports/AgendamentoRepositoryPort";
import type { DisponibilidadeProfissionalRepositoryPort } from "../ports/DisponibilidadeProfissionalRepositoryPort";
import type { LembretePort } from "../ports/LembretePort";
import type { ProcedimentoRepositoryPort } from "../ports/ProcedimentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";
import { MarcarConsultaCore } from "./marcarConsultaCore";

export type MarcarConsultaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  pacienteId: string;
  profissionalId: string;
  procedimentoId: string;
  dataHoraInicio: Date;
  origem: OrigemAgendamento;
  /** Se omitido, usa `duracaoPadraoMinutos` do procedimento. */
  duracaoMinutos?: number;
};

/**
 * Porta autenticada: valida sessão/RBAC e delega ao {@link MarcarConsultaCore}.
 */
export class MarcarConsulta {
  private readonly core: MarcarConsultaCore;

  constructor(
    agendamentoRepo: AgendamentoRepositoryPort,
    disponibilidadeRepo: DisponibilidadeProfissionalRepositoryPort,
    procedimentoRepo: ProcedimentoRepositoryPort,
    pacienteRepo: PacienteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    lembrete: LembretePort,
  ) {
    this.core = new MarcarConsultaCore(
      agendamentoRepo,
      disponibilidadeRepo,
      procedimentoRepo,
      pacienteRepo,
      profissionalRepo,
      lembrete,
    );
  }

  async executar(input: MarcarConsultaInput): Promise<Agendamento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "marcar_consulta");

    return this.core.executar({
      clinicaId: input.clinicaId,
      pacienteId: input.pacienteId,
      profissionalId: input.profissionalId,
      procedimentoId: input.procedimentoId,
      dataHoraInicio: input.dataHoraInicio,
      origem: input.origem,
      duracaoMinutos: input.duracaoMinutos,
    });
  }
}
