import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { Evolucao } from "../../domain/Evolucao";
import { ProntuarioNaoEncontradoError } from "../../domain/errors";
import type { EvolucaoRepositoryPort } from "../ports/EvolucaoRepositoryPort";
import type { ProntuarioRepositoryPort } from "../ports/ProntuarioRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ObterEvolucoesDoProntuarioInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
};

/**
 * Lista evoluções do prontuário (spec 003).
 * Não gera log de auditoria no MVP (só `ConsultarProntuario` por id).
 */
export class ObterEvolucoesDoProntuario {
  constructor(
    private readonly evolucaoRepo: EvolucaoRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ObterEvolucoesDoProntuarioInput,
  ): Promise<Evolucao[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "obter_evolucoes");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    return this.evolucaoRepo.listarPorProntuario(
      input.clinicaId,
      prontuario.id,
    );
  }
}
