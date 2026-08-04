import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { VerificarAcessoAtivo } from "@/core/assinatura/application/use-cases/VerificarAcessoAtivo";
import { Slug } from "@/core/shared/Slug";

import {
  ContextoAgendamentoPublico,
  montarContextoAgendamentoPublico,
} from "../../domain/ContextoAgendamentoPublico";
import {
  AcessoClinicaInativoParaLinkPublicoError,
  ClinicaNaoEncontradaPorSlugError,
  ProfissionalNaoEncontradoPorSlugError,
} from "../../domain/errors";

export type ResolverContextoAgendamentoPublicoInput = {
  slugClinica: string;
  slugProfissional?: string;
};

/**
 * Resolve slugs → `ContextoAgendamentoPublico`.
 * Gates: `Clinica.status = ativa` (domínio) + `VerificarAcessoAtivo` (010).
 */
export class ResolverContextoAgendamentoPublico {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly verificarAcessoAtivo: VerificarAcessoAtivo,
  ) {}

  async executar(
    input: ResolverContextoAgendamentoPublicoInput,
  ): Promise<ContextoAgendamentoPublico> {
    const slugClinica = Slug.criar(input.slugClinica).valor;
    const clinica = await this.clinicaRepo.buscarPorSlug(slugClinica);
    if (!clinica) {
      throw new ClinicaNaoEncontradaPorSlugError(slugClinica);
    }

    const contexto = montarContextoAgendamentoPublico({
      clinica,
      profissionalSlug: input.slugProfissional,
    });

    const acesso = await this.verificarAcessoAtivo.executar({
      clinicaId: clinica.id,
    });
    if (!acesso.permitido) {
      throw new AcessoClinicaInativoParaLinkPublicoError(clinica.id);
    }

    if (contexto.profissionalSlug) {
      const profissional = await this.profissionalRepo.buscarPorSlug(
        clinica.id,
        contexto.profissionalSlug,
      );
      if (!profissional) {
        throw new ProfissionalNaoEncontradoPorSlugError(
          clinica.id,
          contexto.profissionalSlug,
        );
      }
    }

    return contexto;
  }
}
