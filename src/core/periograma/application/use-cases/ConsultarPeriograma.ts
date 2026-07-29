import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { PeriogramaNaoEncontradoError } from "../../domain/errors";
import type { Periograma } from "../../domain/Periograma";
import type { PeriogramaRepositoryPort } from "../ports/PeriogramaRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ConsultarPeriogramaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  periogramaId: string;
};

/**
 * Consulta um periograma pelo id no tenant (spec 005).
 */
export class ConsultarPeriograma {
  constructor(
    private readonly periogramaRepo: PeriogramaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: ConsultarPeriogramaInput): Promise<Periograma> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "consultar_periograma");

    const periograma = await this.periogramaRepo.buscarPorId(
      input.clinicaId,
      input.periogramaId,
    );
    if (!periograma) {
      throw new PeriogramaNaoEncontradoError(input.periogramaId);
    }

    return periograma;
  }
}
