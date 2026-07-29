import type { Periograma } from "../../domain/Periograma";
import type { PeriogramaRepositoryPort } from "../ports/PeriogramaRepositoryPort";

/**
 * Fake append-only: só `salvar` / leitura — sem update (spec 005).
 * Listagem ordena por `registradoEm` descendente.
 */
export class FakePeriogramaRepository implements PeriogramaRepositoryPort {
  readonly items = new Map<string, Periograma>();

  async salvar(periograma: Periograma): Promise<void> {
    this.items.set(periograma.id, periograma);
  }

  async buscarPorId(
    clinicaId: string,
    periogramaId: string,
  ): Promise<Periograma | null> {
    const encontrado = this.items.get(periogramaId);
    if (!encontrado || encontrado.clinicaId !== clinicaId) return null;
    return encontrado;
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Periograma[]> {
    return [...this.items.values()]
      .filter(
        (p) => p.clinicaId === clinicaId && p.prontuarioId === prontuarioId,
      )
      .sort((a, b) => b.registradoEm.getTime() - a.registradoEm.getTime());
  }
}
