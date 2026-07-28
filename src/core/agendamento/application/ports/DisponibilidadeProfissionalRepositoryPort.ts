import type { DisponibilidadeProfissional } from "../../domain/DisponibilidadeProfissional";

export interface DisponibilidadeProfissionalRepositoryPort {
  /**
   * Substitui o conjunto completo de janelas do profissional na clínica
   * (definição idempotente da grade semanal).
   */
  substituirJanelas(
    clinicaId: string,
    profissionalId: string,
    janelas: DisponibilidadeProfissional[],
  ): Promise<void>;

  listarPorProfissional(
    clinicaId: string,
    profissionalId: string,
  ): Promise<DisponibilidadeProfissional[]>;
}
