import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { Procedimento } from "../../domain/Procedimento";
import type { ProcedimentoRepositoryPort } from "../ports/ProcedimentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarProcedimentosInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
};

export class ListarProcedimentos {
  constructor(
    private readonly procedimentoRepo: ProcedimentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: ListarProcedimentosInput): Promise<Procedimento[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_procedimentos");

    return this.procedimentoRepo.listarPorClinica(input.clinicaId);
  }
}
