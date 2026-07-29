import type { EventoOdontograma } from "../../domain/EventoOdontograma";
import type { FaceOdontograma } from "../../domain/FaceOdontograma";

export type FiltrosHistoricoOdontograma = {
  numeroDente?: number;
  face?: FaceOdontograma;
  /** Inclusivo — eventos com `registradoEm` >= `de`. */
  de?: Date;
  /** Inclusivo — eventos com `registradoEm` <= `ate`. */
  ate?: Date;
};

/**
 * Persistência append-only de eventos do odontograma (spec 004).
 * Sempre escopada por `clinicaId`. Não há update/delete de eventos.
 */
export interface OdontogramaRepositoryPort {
  /**
   * Persiste um ou mais eventos novos (imutáveis) de forma **atômica
   * (tudo-ou-nada)**.
   *
   * Contrato obrigatório para o adapter (ex.: Drizzle):
   * - Executar o lote em **uma única transação de banco explícita**.
   * - Se qualquer evento falhar (violação de constraint, erro de conexão,
   *   falha de escrita, etc.), a transação deve ser abortada e
   *   **nenhum** evento do lote pode permanecer persistido.
   * - Atribuir `sequencia` via bigserial (auto-incremento) na inserção e
   *   devolver os eventos reconstituídos com `sequencia` preenchida.
   *
   * Validação de invariantes de domínio (ex.: dente ausente) ocorre no
   * caso de uso **antes** desta chamada; mesmo assim o adapter não pode
   * persistir parcialmente se a escrita falhar no meio do lote.
   *
   * @returns eventos reconstituídos com `sequencia` atribuída pelo banco
   */
  salvarEventos(eventos: EventoOdontograma[]): Promise<EventoOdontograma[]>;

  /**
   * Histórico do prontuário no tenant.
   * Ordenação esperada: `registradoEm` ascendente, desempate por
   * `sequencia` ascendente (mesma regra de `compararEventos`).
   * Filtros opcionais aplicados na leitura.
   */
  listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
    filtros?: FiltrosHistoricoOdontograma,
  ): Promise<EventoOdontograma[]>;
}
