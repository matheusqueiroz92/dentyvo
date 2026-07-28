import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { ProcedimentoNaoEncontradoError } from "../../domain/errors";
import type { Procedimento } from "../../domain/Procedimento";
import type { ProcedimentoRepositoryPort } from "../ports/ProcedimentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type BuscarProcedimentoPorIdInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  procedimentoId: string;
};

export class BuscarProcedimentoPorId {
  constructor(
    private readonly procedimentoRepo: ProcedimentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: BuscarProcedimentoPorIdInput): Promise<Procedimento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "buscar_procedimento");

    const procedimento = await this.procedimentoRepo.buscarPorId(
      input.clinicaId,
      input.procedimentoId,
    );
    if (!procedimento) {
      throw new ProcedimentoNaoEncontradoError(input.procedimentoId);
    }
    return procedimento;
  }
}
