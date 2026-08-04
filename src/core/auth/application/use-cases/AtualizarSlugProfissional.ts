import { DadosInvalidosError } from "@/core/shared/errors";
import { Slug } from "@/core/shared/Slug";

import type { Profissional } from "../../domain/Profissional";
import type { ProfissionalRepositoryPort } from "../ports/ProfissionalRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type AtualizarSlugProfissionalInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  profissionalId: string;
  slug: string;
};

/**
 * Admin atualiza o slug público de um profissional (RBAC: `editar_clinica`).
 * Unicidade por tenant: rejeita se outro membro já usa o slug.
 */
export class AtualizarSlugProfissional {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(input: AtualizarSlugProfissionalInput): Promise<Profissional> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "editar_clinica");

    const profissional = await this.profissionalRepo.buscarPorId(
      input.clinicaId,
      input.profissionalId,
    );
    if (!profissional) {
      throw new DadosInvalidosError(
        `Profissional não encontrado: ${input.profissionalId}.`,
      );
    }

    const slug = Slug.criar(input.slug).valor;
    const ocupado = await this.profissionalRepo.buscarPorSlug(
      input.clinicaId,
      slug,
    );
    if (ocupado && ocupado.id !== profissional.id) {
      throw new DadosInvalidosError(
        "Este slug já está em uso por outro profissional nesta clínica.",
      );
    }

    const atualizado = profissional.atualizarSlug(slug);
    await this.profissionalRepo.salvar(atualizado);
    return atualizado;
  }
}
