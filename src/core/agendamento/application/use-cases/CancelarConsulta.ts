import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { AgendamentoNaoEncontradoError } from "../../domain/errors";
import type { AgendamentoRepositoryPort } from "../ports/AgendamentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type CancelarConsultaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  agendamentoId: string;
  motivo?: string | null;
};

/**
 * Cancela consulta e libera o slot (motivo opcional).
 */
export class CancelarConsulta {
  constructor(
    private readonly agendamentoRepo: AgendamentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: CancelarConsultaInput): Promise<void> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "cancelar_consulta");

    const atual = await this.agendamentoRepo.buscarPorId(
      input.clinicaId,
      input.agendamentoId,
    );
    if (!atual) {
      throw new AgendamentoNaoEncontradoError(input.agendamentoId);
    }

    const cancelado = atual.cancelar(input.motivo);
    await this.agendamentoRepo.salvar(cancelado);
  }
}
