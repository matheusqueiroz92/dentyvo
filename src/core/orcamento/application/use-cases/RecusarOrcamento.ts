import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { Orcamento } from "../../domain/Orcamento";
import { OrcamentoNaoEncontradoError } from "../../domain/errors";
import type { OrcamentoRepositoryPort } from "../ports/OrcamentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type RecusarOrcamentoInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  orcamentoId: string;
};

/**
 * Registra recusa do paciente: `enviado` → `recusado` via `Orcamento.recusar()`
 * (spec 015).
 */
export class RecusarOrcamento {
  constructor(
    private readonly orcamentoRepo: OrcamentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: RecusarOrcamentoInput): Promise<Orcamento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "recusar_orcamento");

    const orcamento = await this.orcamentoRepo.buscarPorId(
      input.clinicaId,
      input.orcamentoId,
    );
    if (!orcamento) {
      throw new OrcamentoNaoEncontradoError(input.orcamentoId);
    }

    const recusado = orcamento.recusar();
    await this.orcamentoRepo.atualizarStatus(recusado);
    return recusado;
  }
}
