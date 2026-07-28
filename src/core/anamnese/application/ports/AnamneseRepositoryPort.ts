import type { Anamnese } from "../../domain/Anamnese";

/** Persistência de snapshots de anamnese (spec 003). */
export interface AnamneseRepositoryPort {
  /** Persiste novo snapshot; não sobrescreve versões anteriores. */
  salvar(anamnese: Anamnese): Promise<void>;

  listarPorProntuario(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Anamnese[]>;

  /** Versão vigente = maior `versao` do prontuário. */
  buscarVersaoVigente(
    clinicaId: string,
    prontuarioId: string,
  ): Promise<Anamnese | null>;
}
