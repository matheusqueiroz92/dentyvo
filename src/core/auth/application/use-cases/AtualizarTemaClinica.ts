import { DadosInvalidosError } from "@/core/shared/errors";

import type { Clinica } from "../../domain/Clinica";
import type { TemaClinica } from "../../domain/TemaClinica";
import type { ClinicaRepositoryPort } from "../ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type AtualizarTemaClinicaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  /** Tema pré-definido ou `null` para o padrão da UI. */
  tema: TemaClinica | null;
};

/**
 * Admin atualiza o tema visual da clínica da sessão (RBAC: só `admin`).
 */
export class AtualizarTemaClinica {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: AtualizarTemaClinicaInput): Promise<Clinica> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "atualizar_tema_clinica");

    const clinica = await this.clinicaRepo.buscarPorId(input.clinicaId);
    if (!clinica) {
      throw new DadosInvalidosError(
        `Clínica não encontrada: ${input.clinicaId}.`,
      );
    }

    const atualizada = clinica.atualizarTema(input.tema);
    const persistida = await this.clinicaRepo.atualizarParcial({
      id: input.clinicaId,
      tema: atualizada.tema,
    });
    if (!persistida) {
      throw new DadosInvalidosError(
        `Clínica não encontrada: ${input.clinicaId}.`,
      );
    }
    return persistida;
  }
}
