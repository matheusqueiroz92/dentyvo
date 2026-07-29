import type { Receita } from "../../domain/Receita";

/** Persistência de receitas — sempre escopada por `clinicaId` (spec 006). */
export interface ReceitaRepositoryPort {
  /** Persiste nova emissão; não sobrescreve receita existente (imutável). */
  salvar(receita: Receita): Promise<void>;

  buscarPorId(clinicaId: string, receitaId: string): Promise<Receita | null>;

  /**
   * Histórico do prontuário no tenant.
   * Ordenação esperada: `emitidaEm` descendente (mais recente primeiro).
   */
  listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Receita[]>;
}
