import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { Orcamento } from "../../domain/Orcamento";
import type { OrcamentoRepositoryPort } from "../ports/OrcamentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarOrcamentosDoProntuarioInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
};

/**
 * Lista orçamentos do prontuário ordenados por `emitidoEm` desc (spec 015).
 */
export class ListarOrcamentosDoProntuario {
  constructor(
    private readonly orcamentoRepo: OrcamentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ListarOrcamentosDoProntuarioInput,
  ): Promise<Orcamento[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_orcamentos_prontuario");

    return this.orcamentoRepo.listarPorProntuario(
      input.clinicaId,
      input.prontuarioId,
    );
  }
}
