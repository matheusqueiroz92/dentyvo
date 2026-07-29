import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import type { Receita } from "../../domain/Receita";
import type { ReceitaRepositoryPort } from "../ports/ReceitaRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarReceitasDoProntuarioInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
};

/**
 * Lista o histórico de receitas do prontuário no tenant (spec 006).
 */
export class ListarReceitasDoProntuario {
  constructor(
    private readonly receitaRepo: ReceitaRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: ListarReceitasDoProntuarioInput): Promise<Receita[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_receitas_prontuario");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    return this.receitaRepo.listarPorProntuario(
      input.clinicaId,
      prontuario.id,
    );
  }
}
