import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { Agendamento } from "../../domain/Agendamento";
import { LEMBRETE_ANTECEDENCIA_PADRAO_MS } from "../../domain/constants";
import { calcularDataHoraFim } from "../../domain/duracao";
import { AgendamentoNaoEncontradoError } from "../../domain/errors";
import type { AgendamentoRepositoryPort } from "../ports/AgendamentoRepositoryPort";
import type { DisponibilidadeProfissionalRepositoryPort } from "../ports/DisponibilidadeProfissionalRepositoryPort";
import type { LembretePort } from "../ports/LembretePort";
import { assertCabeNaDisponibilidade } from "./disponibilidade";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type RemarcarConsultaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  agendamentoId: string;
  novaDataHoraInicio: Date;
  /** Se omitido, mantém a duração atual (fim − início). */
  duracaoMinutos?: number;
};

/**
 * Remarca de forma atômica (libera slot antigo e ocupa o novo).
 */
export class RemarcarConsulta {
  constructor(
    private readonly agendamentoRepo: AgendamentoRepositoryPort,
    private readonly disponibilidadeRepo: DisponibilidadeProfissionalRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly lembrete: LembretePort,
  ) {}

  async executar(input: RemarcarConsultaInput): Promise<Agendamento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "remarcar_consulta");

    const atual = await this.agendamentoRepo.buscarPorId(
      input.clinicaId,
      input.agendamentoId,
    );
    if (!atual) {
      throw new AgendamentoNaoEncontradoError(input.agendamentoId);
    }

    const duracaoAtualMinutos = Math.round(
      (atual.dataHoraFim.getTime() - atual.dataHoraInicio.getTime()) / 60_000,
    );
    const duracaoMinutos = input.duracaoMinutos ?? duracaoAtualMinutos;
    const dataHoraFim = calcularDataHoraFim(
      input.novaDataHoraInicio,
      duracaoMinutos,
    );

    const janelas = await this.disponibilidadeRepo.listarPorProfissional(
      input.clinicaId,
      atual.profissionalId,
    );
    assertCabeNaDisponibilidade({
      profissionalId: atual.profissionalId,
      dataHoraInicio: input.novaDataHoraInicio,
      dataHoraFim,
      janelas,
    });

    const atualizado = atual.remarcar(input.novaDataHoraInicio, duracaoMinutos);

    const existentes =
      await this.agendamentoRepo.listarOcupadosPorProfissionalNoIntervalo(
        input.clinicaId,
        atual.profissionalId,
        atualizado.dataHoraInicio,
        atualizado.dataHoraFim,
      );
    atualizado.assertSemSobreposicaoCom(existentes);

    await this.agendamentoRepo.remarcarAtomicamente(atual, atualizado);

    try {
      await this.lembrete.registrarIntencao({
        agendamentoId: atualizado.id,
        clinicaId: atualizado.clinicaId,
        pacienteId: atualizado.pacienteId,
        profissionalId: atualizado.profissionalId,
        dataHoraConsulta: atualizado.dataHoraInicio,
        dataHoraEnvioPrevisto: new Date(
          atualizado.dataHoraInicio.getTime() - LEMBRETE_ANTECEDENCIA_PADRAO_MS,
        ),
      });
    } catch {
      // best-effort
    }

    return atualizado;
  }
}
