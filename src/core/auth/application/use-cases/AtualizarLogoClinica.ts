import { DadosInvalidosError } from "@/core/shared/errors";

import type { Clinica } from "../../domain/Clinica";
import type { ClinicaRepositoryPort } from "../ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type AtualizarLogoClinicaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  /** URL pública após upload (Vercel Blob) ou `null` para remover. */
  logoUrl: string | null;
};

/**
 * Admin atualiza o logo da clínica da sessão (RBAC: só `admin`).
 *
 * Upload do arquivo ocorre na delivery antes desta chamada; o caso de uso
 * persiste a URL.
 */
export class AtualizarLogoClinica {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: AtualizarLogoClinicaInput): Promise<Clinica> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "atualizar_logo_clinica");

    const clinica = await this.clinicaRepo.buscarPorId(input.clinicaId);
    if (!clinica) {
      throw new DadosInvalidosError(
        `Clínica não encontrada: ${input.clinicaId}.`,
      );
    }

    const atualizada = clinica.atualizarLogo(input.logoUrl);
    await this.clinicaRepo.salvar(atualizada);
    return atualizada;
  }
}
