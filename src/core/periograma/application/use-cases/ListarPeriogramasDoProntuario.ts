import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import type { Periograma } from "../../domain/Periograma";
import type { PeriogramaRepositoryPort } from "../ports/PeriogramaRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarPeriogramasDoProntuarioInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
};

/**
 * Lista periogramas do prontuário ordenados por `registradoEm` descendente
 * (mais recente primeiro) — spec 005.
 */
export class ListarPeriogramasDoProntuario {
  constructor(
    private readonly periogramaRepo: PeriogramaRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ListarPeriogramasDoProntuarioInput,
  ): Promise<Periograma[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_periogramas_prontuario");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    return this.periogramaRepo.listarPorProntuario(
      input.clinicaId,
      prontuario.id,
    );
  }
}
