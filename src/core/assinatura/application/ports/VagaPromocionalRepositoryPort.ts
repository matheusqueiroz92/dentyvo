import type { VagaPromocional } from "../../domain/VagaPromocional";
import {
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
  MAX_RETRIES_RESERVA_VAGA_POSICAO,
} from "../../domain/constants";

export type ReservarVagaPromocionalAtomicoInput = {
  clinicaId: string;
  assinaturaId: string;
  agora: Date;
};

/**
 * Persistência da fonte de verdade da reserva (spec 012, D3 / D6).
 *
 * `reservarAtomico` **deve** usar **uma única** statement:
 *
 * ```sql
 * INSERT INTO vaga_promocional_lancamento
 *   (posicao, clinica_id, assinatura_id, reservada_em)
 * SELECT s.posicao, $clinicaId, $assinaturaId, $agora
 * FROM generate_series(1, 30) AS s(posicao)
 * WHERE NOT EXISTS (
 *   SELECT 1 FROM vaga_promocional_lancamento v WHERE v.posicao = s.posicao
 * )
 * ORDER BY s.posicao
 * LIMIT 1
 * RETURNING *;
 * ```
 *
 * - 0 rows → `VagasPromocionaisEsgotadasError`
 * - `unique_violation` em `posicao` → retry da **mesma** statement
 *   (máx. {@link MAX_RETRIES_RESERVA_VAGA_POSICAO})
 * - `unique_violation` em `clinica_id` → retornar vaga existente (idempotente)
 *
 * **Proibido:** `SELECT MAX` / `COUNT` + `INSERT` em operações separadas.
 */
export interface VagaPromocionalRepositoryPort {
  reservarAtomico(
    input: ReservarVagaPromocionalAtomicoInput,
  ): Promise<VagaPromocional>;

  buscarPorClinica(clinicaId: string): Promise<VagaPromocional | null>;

  buscarPorAssinaturaId(
    assinaturaId: string,
  ): Promise<VagaPromocional | null>;

  /** Quantidade de posições já reservadas (0..{@link LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO}). */
  contarReservadas(): Promise<number>;
}

/** Reexport para adapters/documentação. */
export {
  LIMITE_VAGAS_PROMOCIONAIS_LANCAMENTO,
  MAX_RETRIES_RESERVA_VAGA_POSICAO,
};
