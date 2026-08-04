import { DadosInvalidosError } from "@/core/shared/errors";
import { Slug } from "@/core/shared/Slug";

import type { Clinica } from "../../domain/Clinica";
import type { ClinicaRepositoryPort } from "../ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type AtualizarSlugClinicaInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  slug: string;
};

/**
 * Admin atualiza o slug público da clínica (RBAC: `editar_clinica`).
 * Unicidade global: rejeita se outro tenant já usa o slug.
 */
export class AtualizarSlugClinica {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: AtualizarSlugClinicaInput): Promise<Clinica> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "editar_clinica");

    const clinica = await this.clinicaRepo.buscarPorId(input.clinicaId);
    if (!clinica) {
      throw new DadosInvalidosError(
        `Clínica não encontrada: ${input.clinicaId}.`,
      );
    }

    const slug = Slug.criar(input.slug).valor;
    const ocupado = await this.clinicaRepo.buscarPorSlug(slug);
    if (ocupado && ocupado.id !== clinica.id) {
      throw new DadosInvalidosError(
        "Este slug já está em uso por outra clínica.",
      );
    }

    const atualizada = clinica.atualizarSlug(slug);
    await this.clinicaRepo.salvar(atualizada);
    return atualizada;
  }
}
