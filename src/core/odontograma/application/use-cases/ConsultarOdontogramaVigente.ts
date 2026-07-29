import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { ProntuarioRepositoryPort } from "@/core/prontuario/application/ports/ProntuarioRepositoryPort";
import { ProntuarioNaoEncontradoError } from "@/core/prontuario/domain/errors";

import {
  projetarOdontogramaVigente,
  type OdontogramaVigente,
} from "../../domain/OdontogramaVigente";
import type { OdontogramaRepositoryPort } from "../ports/OdontogramaRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ConsultarOdontogramaVigenteInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  prontuarioId: string;
};

/**
 * Consulta a visão agregada vigente do odontograma (spec 004).
 * Derivada dos eventos — não há snapshot persistido.
 */
export class ConsultarOdontogramaVigente {
  constructor(
    private readonly odontogramaRepo: OdontogramaRepositoryPort,
    private readonly prontuarioRepo: ProntuarioRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ConsultarOdontogramaVigenteInput,
  ): Promise<OdontogramaVigente> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "consultar_odontograma_vigente");

    const prontuario = await this.prontuarioRepo.buscarPorId(
      input.clinicaId,
      input.prontuarioId,
    );
    if (!prontuario) {
      throw new ProntuarioNaoEncontradoError(input.prontuarioId);
    }

    const historico = await this.odontogramaRepo.listarPorProntuario(
      input.clinicaId,
      prontuario.id,
    );

    return projetarOdontogramaVigente(
      prontuario.id,
      input.clinicaId,
      historico,
    );
  }
}
