import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import type { Anamnese } from "../../domain/Anamnese";
import type { AnamneseRepositoryPort } from "../ports/AnamneseRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarVersoesAnamneseInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
};

/**
 * Lista snapshots de anamnese do prontuário (spec 003).
 * Sem log de auditoria no MVP (só `ConsultarProntuario`).
 */
export class ListarVersoesAnamnese {
  constructor(
    private readonly anamneseRepo: AnamneseRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: ListarVersoesAnamneseInput): Promise<Anamnese[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_versoes_anamnese");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    return this.anamneseRepo.listarPorProntuario(
      input.clinicaId,
      prontuario.id,
    );
  }
}
