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
   * Contrato obrigatório para o adapter (ex.: Drizzle / fake):
   * - Executar o lote em **uma única transação de banco explícita**.
   * - Se qualquer evento falhar (violação de constraint, erro de conexão,
   *   falha de escrita, etc.), a transação deve ser abortada e
   *   **nenhum** evento do lote pode permanecer persistido.
   * - Atribuir `sequencia` via bigserial (auto-incremento) na inserção e
   *   devolver os eventos reconstituídos com `sequencia` preenchida.
   *
   * **Ordem de `sequencia` ≡ ordem do array `eventos` (contrato com o domínio):**
   * - Para índices `i < j`, o evento persistido em `eventos[i]` **deve**
   *   receber `sequencia` estritamente menor que o de `eventos[j]`.
   * - Inserção **sequencial na ordem do array**, na mesma transação.
   * - **Proibido:** `Promise.all` / inserts paralelos do lote; multi-row
   *   `INSERT ... VALUES (...), (...)` sem garantia documentada de ordem
   *   de bigserial — preferir um insert por item, na ordem do array.
   *
   * `assertLoteNaoViolaEstadoDenteInteiro` valida o lote **nessa mesma
   * ordem** (array = ordem futura de `sequencia`). O caso de uso
   * `RegistrarEventosOdontograma` deve passar ao `salvarEventos` o array
   * na mesma ordem em que validou — sem reordenar.
   *
   * Validação de invariantes de domínio ocorre no caso de uso **antes**
   * desta chamada; mesmo assim o adapter não pode persistir parcialmente
   * se a escrita falhar no meio do lote.
   *
   * @returns eventos reconstituídos com `sequencia` atribuída pelo banco,
   *   na mesma ordem do array de entrada
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
