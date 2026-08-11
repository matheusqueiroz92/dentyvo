import type { Atestado } from "../../domain/Atestado";

/** Persistência de atestados — sempre escopada por `clinicaId` (spec 006b). */
export interface AtestadoRepositoryPort {
  /** Persiste nova emissão; não sobrescreve atestado existente (imutável). */
  salvar(atestado: Atestado): Promise<void>;

  buscarPorId(clinicaId: string, atestadoId: string): Promise<Atestado | null>;

  /**
   * Histórico do prontuário no tenant.
   * Ordenação esperada: `emitidaEm` descendente (mais recente primeiro).
   */
  listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Atestado[]>;
}
