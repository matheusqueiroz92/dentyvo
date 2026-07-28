import { randomUUID } from "node:crypto";

import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import { ProfissionalNaoEncontradoError } from "@/core/auth/domain/errors";
import type { PacienteRepositoryPort } from "@/core/paciente/application/ports/PacienteRepositoryPort";
import { PacienteNaoEncontradoError } from "@/core/paciente/domain/errors";

import { Agendamento } from "../../domain/Agendamento";
import { LEMBRETE_ANTECEDENCIA_PADRAO_MS } from "../../domain/constants";
import { calcularDataHoraFim } from "../../domain/duracao";
import {
  ProcedimentoNaoEncontradoError,
} from "../../domain/errors";
import type { OrigemAgendamento } from "../../domain/StatusAgendamento";
import type { AgendamentoRepositoryPort } from "../ports/AgendamentoRepositoryPort";
import type { DisponibilidadeProfissionalRepositoryPort } from "../ports/DisponibilidadeProfissionalRepositoryPort";
import type { LembretePort } from "../ports/LembretePort";
import type { ProcedimentoRepositoryPort } from "../ports/ProcedimentoRepositoryPort";
import { assertCabeNaDisponibilidade } from "./disponibilidade";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

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
 * Marca consulta (`pendente`), valida disponibilidade/sobreposição e registra
 * intenção de lembrete (best-effort).
 */
export class MarcarConsulta {
  constructor(
    private readonly agendamentoRepo: AgendamentoRepositoryPort,
    private readonly disponibilidadeRepo: DisponibilidadeProfissionalRepositoryPort,
    private readonly procedimentoRepo: ProcedimentoRepositoryPort,
    private readonly pacienteRepo: PacienteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly lembrete: LembretePort,
  ) {}

  async executar(input: MarcarConsultaInput): Promise<Agendamento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "marcar_consulta");

    const profissional = await this.profissionalRepo.buscarPorId(
      input.clinicaId,
      input.profissionalId,
    );
    if (!profissional) {
      throw new ProfissionalNaoEncontradoError(input.profissionalId);
    }

    const paciente = await this.pacienteRepo.buscarPorId(
      input.clinicaId,
      input.pacienteId,
    );
    if (!paciente) {
      throw new PacienteNaoEncontradoError(input.pacienteId);
    }

    const procedimento = await this.procedimentoRepo.buscarPorId(
      input.clinicaId,
      input.procedimentoId,
    );
    if (!procedimento) {
      throw new ProcedimentoNaoEncontradoError(input.procedimentoId);
    }

    const duracaoMinutos =
      input.duracaoMinutos ?? procedimento.duracaoPadraoMinutos;
    const dataHoraFim = calcularDataHoraFim(input.dataHoraInicio, duracaoMinutos);

    const janelas = await this.disponibilidadeRepo.listarPorProfissional(
      input.clinicaId,
      input.profissionalId,
    );
    assertCabeNaDisponibilidade({
      profissionalId: input.profissionalId,
      dataHoraInicio: input.dataHoraInicio,
      dataHoraFim,
      janelas,
    });

    const existentes =
      await this.agendamentoRepo.listarOcupadosPorProfissionalNoIntervalo(
        input.clinicaId,
        input.profissionalId,
        input.dataHoraInicio,
        dataHoraFim,
      );

    const agendamento = Agendamento.criar({
      id: randomUUID(),
      clinicaId: input.clinicaId,
      pacienteId: input.pacienteId,
      profissionalId: input.profissionalId,
      procedimentoId: input.procedimentoId,
      dataHoraInicio: input.dataHoraInicio,
      duracaoMinutos,
      origem: input.origem,
    });
    agendamento.assertSemSobreposicaoCom(existentes);

    await this.agendamentoRepo.salvarOcupandoSlot(agendamento);

    try {
      await this.lembrete.registrarIntencao({
        agendamentoId: agendamento.id,
        clinicaId: agendamento.clinicaId,
        pacienteId: agendamento.pacienteId,
        profissionalId: agendamento.profissionalId,
        dataHoraConsulta: agendamento.dataHoraInicio,
        dataHoraEnvioPrevisto: new Date(
          agendamento.dataHoraInicio.getTime() - LEMBRETE_ANTECEDENCIA_PADRAO_MS,
        ),
      });
    } catch {
      // best-effort: não desfaz o agendamento
    }

    return agendamento;
  }
}
