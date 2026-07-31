import type { Agendamento } from "../../domain/Agendamento";

/**
 * Persistência de agendamentos. Adapters devem garantir atomicidade e
 * constraint de exclusão para concorrência (spec 002 — invariante de negócio).
 */
export interface AgendamentoRepositoryPort {
  /**
   * Persiste agendamento que ocupa slot. Deve falhar se houver sobreposição
   * concorrente (ex.: EXCLUDE GiST / equivalente), além da checagem de domínio.
   */
  salvarOcupandoSlot(agendamento: Agendamento): Promise<void>;

  /**
   * Atualiza remarcação de forma atômica (libera intervalo antigo e ocupa o novo).
   */
  remarcarAtomicamente(
    anterior: Agendamento,
    atualizado: Agendamento,
  ): Promise<void>;

  /** Persistência de cancelamento (libera slot). */
  salvar(agendamento: Agendamento): Promise<void>;

  buscarPorId(
    clinicaId: string,
    agendamentoId: string,
  ): Promise<Agendamento | null>;

  /**
   * Agendamentos do profissional que ocupam slot e intersectam o intervalo
   * half-open informado (para checagem de domínio / listagem).
   */
  listarOcupadosPorProfissionalNoIntervalo(
    clinicaId: string,
    profissionalId: string,
    inicio: Date,
    fim: Date,
  ): Promise<Agendamento[]>;

  /**
   * Agendamentos da clínica cujo `dataHoraInicio` está no intervalo half-open
   * `[dataInicio, dataFim)`. Inclui todos os status. Filtro opcional por
   * profissional. Ordenação: `dataHoraInicio` ascendente (spec 002).
   */
  listarPorPeriodo(
    clinicaId: string,
    dataInicio: Date,
    dataFim: Date,
    profissionalId?: string,
  ): Promise<Agendamento[]>;
}
