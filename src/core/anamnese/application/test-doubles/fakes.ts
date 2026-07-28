import type { Anamnese } from "../../domain/Anamnese";
import type { AnamneseRepositoryPort } from "../ports/AnamneseRepositoryPort";

export class FakeAnamneseRepository implements AnamneseRepositoryPort {
  readonly items = new Map<string, Anamnese>();

  async salvar(anamnese: Anamnese): Promise<void> {
    this.items.set(anamnese.id, anamnese);
  }

  async listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Anamnese[]> {
    return [...this.items.values()]
      .filter(
        (a) => a.clinicaId === clinicaId && a.prontuarioId === prontuarioId,
      )
      .sort((a, b) => a.versao - b.versao);
  }

  async buscarVersaoVigente(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Anamnese | null> {
    const versoes = await this.listarPorProntuario(clinicaId, prontuarioId);
    if (versoes.length === 0) return null;
    return versoes[versoes.length - 1] ?? null;
  }
}

export const respostasAnamneseValidas = {
  historicoMedico: { texto: "Hipertensão controlada", negado: false },
  alergias: { texto: null, negado: true },
  medicacoesEmUso: { texto: "Losartana", negado: false },
  condicoesPreexistentes: { texto: null, negado: true },
} as const;
