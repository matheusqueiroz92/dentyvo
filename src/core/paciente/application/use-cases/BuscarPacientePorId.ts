import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { PacienteNaoEncontradoError } from "../../domain/errors";
import type { Paciente } from "../../domain/Paciente";
import type { PacienteRepositoryPort } from "../ports/PacienteRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type BuscarPacientePorIdInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  pacienteId: string;
};

/**
 * Busca paciente por id, escopado ao tenant (spec 002).
 */
export class BuscarPacientePorId {
  constructor(
    private readonly pacienteRepo: PacienteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: BuscarPacientePorIdInput): Promise<Paciente> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "buscar_paciente");

    const paciente = await this.pacienteRepo.buscarPorId(
      input.clinicaId,
      input.pacienteId,
    );
    if (!paciente) {
      throw new PacienteNaoEncontradoError(input.pacienteId);
    }
    return paciente;
  }
}
