import type { Evolucao } from "../../domain/Evolucao";

/**
 * Persistência append-only de evoluções (spec 003).
 * Adapters não devem expor update/delete do texto original.
 *
 * Concorrência: o schema garante UNIQUE em `evolucao_retificada_id`.
 * `salvar` deve mapear violação dessa constraint para
 * `EvolucaoJaRetificadaError` (mesmo padrão de EXCLUDE →
 * `SobreposicaoHorarioError` no agendamento).
 */
export interface EvolucaoRepositoryPort {
  /**
   * Persiste evolução. Em retificação concorrente duplicada, lança
   * `EvolucaoJaRetificadaError` (não vazar erro SQL bruto).
   */
  salvar(evolucao: Evolucao): Promise<void>;

  buscarPorId(
    clinicaId: string,
    evolucaoId: string,
  ): Promise<Evolucao | null>;

  listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Evolucao[]>;

  /**
   * Retificação existente da evolução original (MVP: no máximo uma).
   * Checagem otimista no caso de uso; a UNIQUE no banco é a garantia final.
   */
  buscarRetificacaoPorOriginal(
    clinicaId: string,
    evolucaoOriginalId: string,
  ): Promise<Evolucao | null>;
}
