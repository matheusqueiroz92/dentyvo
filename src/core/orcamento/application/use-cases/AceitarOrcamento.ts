import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { Orcamento } from "../../domain/Orcamento";
import { OrcamentoNaoEncontradoError } from "../../domain/errors";
import type { OrcamentoRepositoryPort } from "../ports/OrcamentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type AceitarOrcamentoInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  orcamentoId: string;
};

/**
 * Registra aceite do paciente: `enviado` → `aceito` via `Orcamento.aceitar()`
 * (spec 015). Não cria agendamento.
 */
export class AceitarOrcamento {
  constructor(
    private readonly orcamentoRepo: OrcamentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: AceitarOrcamentoInput): Promise<Orcamento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "aceitar_orcamento");

    const orcamento = await this.orcamentoRepo.buscarPorId(
      input.clinicaId,
      input.orcamentoId,
    );
    if (!orcamento) {
      throw new OrcamentoNaoEncontradoError(input.orcamentoId);
    }

    const aceito = orcamento.aceitar();
    await this.orcamentoRepo.atualizarStatus(aceito);
    return aceito;
  }
}
