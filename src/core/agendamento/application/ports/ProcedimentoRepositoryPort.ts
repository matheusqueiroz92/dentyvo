import type { Procedimento } from "../../domain/Procedimento";

export interface ProcedimentoRepositoryPort {
  salvar(procedimento: Procedimento): Promise<void>;
  buscarPorId(
    clinicaId: string,
    procedimentoId: string,
  ): Promise<Procedimento | null>;
  listarPorClinica(clinicaId: string): Promise<Procedimento[]>;
}
