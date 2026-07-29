import type { Periograma } from "../../domain/Periograma";

/** Persistência de periogramas — sempre escopada por `clinicaId` (spec 005). */
export interface PeriogramaRepositoryPort {
  /**
   * Persiste novo exame; não sobrescreve periograma existente (imutável).
   * Correção = novo registro `reavaliacao`.
   */
  salvar(periograma: Periograma): Promise<void>;

  buscarPorId(
    clinicaId: string,
    periogramaId: string,
  ): Promise<Periograma | null>;

  /**
   * Histórico do prontuário no tenant.
   * Ordenação: `registradoEm` descendente (mais recente primeiro).
   */
  listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Periograma[]>;
}
