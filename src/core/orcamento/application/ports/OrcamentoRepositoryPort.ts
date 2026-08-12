import type { Orcamento } from "../../domain/Orcamento";

/**
 * Persistência de orçamentos — sempre escopada por `clinicaId` (spec 015).
 *
 * Conteúdo (itens, cabeçalho, `validoAte`) é imutável após emissão.
 * Só o status transiciona via `atualizarStatus` (após `Orcamento.aceitar()` /
 * `recusar()` na entidade — única fonte de verdade da transição de domínio).
 *
 * ## Transição de status e concorrência
 * `atualizarStatus` **deve** ser um UPDATE **condicional** (mesmo espírito
 * de UNIQUE → `EvolucaoJaRetificadaError` / EXCLUDE → `SobreposicaoHorarioError`):
 *
 * ```sql
 * UPDATE orcamento
 * SET status = $novoStatus
 * WHERE id = $id
 *   AND clinica_id = $clinicaId
 *   AND status = 'enviado';
 * ```
 *
 * - **1 linha afetada** → sucesso.
 * - **0 linhas afetadas** → o status já mudou entre a leitura e a escrita
 *   (corrida TOCTOU); o adapter **deve** lançar
 *   `OrcamentoStatusConflitoError` — **proibido** UPDATE incondicional
 *   só por `id` (isso sobrescreveria `aceito`↔`recusado` e apagaria a
 *   proteção da entidade).
 *
 * Domínio (`Orcamento.aceitar` / `recusar`) rejeita transição inválida na
 * instância já carregada (`OrcamentoStatusInvalidoError`). A condição no
 * SQL é a garantia final contra duas decisões simultâneas.
 */
export interface OrcamentoRepositoryPort {
  /** Persiste nova emissão; não sobrescreve orçamento existente. */
  salvar(orcamento: Orcamento): Promise<void>;

  /**
   * Persiste apenas a transição de status (`enviado` → `aceito` | `recusado`).
   * Adapter NÃO deve alterar itens, cabeçalho nem `validoAte`.
   *
   * @throws OrcamentoStatusConflitoError se 0 linhas forem afetadas
   *   (status no banco já não é `enviado`).
   */
  atualizarStatus(orcamento: Orcamento): Promise<void>;

  buscarPorId(
    clinicaId: string,
    orcamentoId: string,
  ): Promise<Orcamento | null>;

  /**
   * Histórico do prontuário no tenant.
   * Ordenação esperada: `emitidoEm` descendente (mais recente primeiro).
   */
  listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Orcamento[]>;
}
