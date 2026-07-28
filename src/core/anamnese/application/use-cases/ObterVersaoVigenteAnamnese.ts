import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import type { Anamnese } from "../../domain/Anamnese";
import type { AnamneseRepositoryPort } from "../ports/AnamneseRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ObterVersaoVigenteAnamneseInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
};

/**
 * Retorna a anamnese vigente (maior `versao`) ou `null` se ainda não houver
 * preenchimento (spec 003).
 */
export class ObterVersaoVigenteAnamnese {
  constructor(
    private readonly anamneseRepo: AnamneseRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ObterVersaoVigenteAnamneseInput,
  ): Promise<Anamnese | null> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "obter_versao_vigente_anamnese");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    return this.anamneseRepo.buscarVersaoVigente(
      input.clinicaId,
      prontuario.id,
    );
  }
}
