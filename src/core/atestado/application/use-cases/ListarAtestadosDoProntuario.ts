import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import type { Atestado } from "../../domain/Atestado";
import type { AtestadoRepositoryPort } from "../ports/AtestadoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarAtestadosDoProntuarioInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
};

/**
 * Lista o histórico de atestados do prontuário no tenant (spec 006b).
 */
export class ListarAtestadosDoProntuario {
  constructor(
    private readonly atestadoRepo: AtestadoRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ListarAtestadosDoProntuarioInput,
  ): Promise<Atestado[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_atestados_prontuario");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    return this.atestadoRepo.listarPorProntuario(
      input.clinicaId,
      prontuario.id,
    );
  }
}
