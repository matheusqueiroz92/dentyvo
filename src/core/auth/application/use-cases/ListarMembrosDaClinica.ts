import type { Profissional } from "../../domain/Profissional";
import type { AuthPort } from "../ports/AuthPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ListarMembrosDaClinicaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
};

export class ListarMembrosDaClinica {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly auth: AuthPort,
  ) {}

  async executar(
    input: ListarMembrosDaClinicaInput,
  ): Promise<Profissional[]> {
    void this.auth;
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "listar_membros");

    return this.profissionalRepo.listarPorClinica(input.clinicaId);
  }
}
