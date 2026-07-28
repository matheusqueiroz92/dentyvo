import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { Paciente } from "../../domain/Paciente";
import type { PacienteRepositoryPort } from "../ports/PacienteRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarPacientesInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
};

/**
 * Lista pacientes da clínica da sessão (spec 002).
 */
export class ListarPacientes {
  constructor(
    private readonly pacienteRepo: PacienteRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: ListarPacientesInput): Promise<Paciente[]> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_pacientes");

    return this.pacienteRepo.listarPorClinica(input.clinicaId);
  }
}
