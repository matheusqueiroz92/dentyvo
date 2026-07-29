import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import type { EventoOdontograma } from "../../domain/EventoOdontograma";
import type {
  FiltrosHistoricoOdontograma,
  OdontogramaRepositoryPort,
} from "../ports/OdontogramaRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarHistoricoOdontogramaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
  filtros?: FiltrosHistoricoOdontograma;
};

/**
 * Lista o histórico append-only de eventos do odontograma (spec 004).
 * Ordenação: `registradoEm`, depois `sequencia`.
 */
export class ListarHistoricoOdontograma {
  constructor(
    private readonly odontogramaRepo: OdontogramaRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ListarHistoricoOdontogramaInput,
  ): Promise<EventoOdontograma[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_historico_odontograma");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    return this.odontogramaRepo.listarPorProntuario(
      input.clinicaId,
      prontuario.id,
      input.filtros,
    );
  }
}
