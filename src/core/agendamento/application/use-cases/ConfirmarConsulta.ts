import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { Agendamento } from "../../domain/Agendamento";
import { AgendamentoNaoEncontradoError } from "../../domain/errors";
import type { AgendamentoRepositoryPort } from "../ports/AgendamentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ConfirmarConsultaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  agendamentoId: string;
};

/**
 * Transição `pendente` → `confirmado`.
 */
export class ConfirmarConsulta {
  constructor(
    private readonly agendamentoRepo: AgendamentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: ConfirmarConsultaInput): Promise<Agendamento> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "confirmar_consulta");

    const atual = await this.agendamentoRepo.buscarPorId(
      input.clinicaId,
      input.agendamentoId,
    );
    if (!atual) {
      throw new AgendamentoNaoEncontradoError(input.agendamentoId);
    }

    const confirmado = atual.confirmar();
    await this.agendamentoRepo.salvar(confirmado);
    return confirmado;
  }
}
