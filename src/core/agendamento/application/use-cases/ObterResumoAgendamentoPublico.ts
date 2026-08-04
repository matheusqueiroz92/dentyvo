import { randomUUID } from "node:crypto";

import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import type { ContextoAgendamentoPublico } from "../../domain/ContextoAgendamentoPublico";
import {
  ROTULO_PROCEDIMENTO_CATCH_ALL,
  type ItemMenuPublicoProcedimento,
} from "../../domain/MenuPublicoProcedimento";
import { Procedimento } from "../../domain/Procedimento";
import {
  ClinicaNaoEncontradaPorSlugError,
  ProfissionalNaoEncontradoPorSlugError,
} from "../../domain/errors";
import type { MenuPublicoProcedimentoRepositoryPort } from "../ports/MenuPublicoProcedimentoRepositoryPort";
import type { ProcedimentoRepositoryPort } from "../ports/ProcedimentoRepositoryPort";

export type ProfissionalResumoPublico = {
  id: string;
  nome: string;
  slug: string;
};

export type ResumoAgendamentoPublico = {
  clinica: {
    id: string;
    nome: string;
    slug: string;
    logoUrl: string | null;
  };
  /** Se o contexto já trouxe profissionalSlug, lista com um item; senão elegíveis. */
  profissionais: ProfissionalResumoPublico[];
  /** Menu configurado ou catch-all efetivo ("Consulta/Avaliação"). */
  menu: ItemMenuPublicoProcedimento[];
};

export type ObterResumoAgendamentoPublicoInput = {
  contexto: ContextoAgendamentoPublico;
};

/**
 * Resumo público da clínica para a página de agendamento (sem PII de pacientes).
 *
 * `procedimentoRepo` é opcional na assinatura para compatibilidade com testes
 * que montam só as 3 ports do resumo; em produção deve ser injetado para
 * materializar o catch-all como `Procedimento` real.
 */
export class ObterResumoAgendamentoPublico {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly menuRepo: MenuPublicoProcedimentoRepositoryPort,
    private readonly procedimentoRepo?: ProcedimentoRepositoryPort,
  ) {}

  async executar(
    input: ObterResumoAgendamentoPublicoInput,
  ): Promise<ResumoAgendamentoPublico> {
    const { contexto } = input;
    const clinica = await this.clinicaRepo.buscarPorId(contexto.clinicaId);
    if (!clinica) {
      throw new ClinicaNaoEncontradaPorSlugError(contexto.slug);
    }

    const profissionais = await this.resolverProfissionais(contexto);
    const menu = await this.resolverMenuEfetivo(contexto.clinicaId);

    return {
      clinica: {
        id: clinica.id,
        nome: clinica.nome,
        slug: clinica.slug,
        logoUrl: clinica.logoUrl,
      },
      profissionais,
      menu,
    };
  }

  private async resolverProfissionais(
    contexto: ContextoAgendamentoPublico,
  ): Promise<ProfissionalResumoPublico[]> {
    if (contexto.profissionalSlug) {
      const profissional = await this.profissionalRepo.buscarPorSlug(
        contexto.clinicaId,
        contexto.profissionalSlug,
      );
      if (!profissional) {
        throw new ProfissionalNaoEncontradoPorSlugError(
          contexto.clinicaId,
          contexto.profissionalSlug,
        );
      }
      return [
        {
          id: profissional.id,
          nome: profissional.nome,
          slug: profissional.slug,
        },
      ];
    }

    const membros = await this.profissionalRepo.listarPorClinica(
      contexto.clinicaId,
    );
    return membros.map((p) => ({
      id: p.id,
      nome: p.nome,
      slug: p.slug,
    }));
  }

  private async resolverMenuEfetivo(
    clinicaId: string,
  ): Promise<ItemMenuPublicoProcedimento[]> {
    const menu = await this.menuRepo.buscarPorClinicaId(clinicaId);
    if (menu.estaConfigurado) {
      return [...menu.itens];
    }

    const procedimentoId = await this.garantirProcedimentoCatchAllId(clinicaId);
    return [
      {
        rotuloPublico: ROTULO_PROCEDIMENTO_CATCH_ALL,
        procedimentoId,
      },
    ];
  }

  private async garantirProcedimentoCatchAllId(
    clinicaId: string,
  ): Promise<string> {
    if (!this.procedimentoRepo) {
      return `catch-all:${clinicaId}`;
    }

    const existentes = await this.procedimentoRepo.listarPorClinica(clinicaId);
    const jaExiste = existentes.find(
      (p) => p.nome === ROTULO_PROCEDIMENTO_CATCH_ALL,
    );
    if (jaExiste) {
      return jaExiste.id;
    }

    const criado = Procedimento.criar({
      id: randomUUID(),
      clinicaId,
      nome: ROTULO_PROCEDIMENTO_CATCH_ALL,
      duracaoPadraoMinutos: 60,
      valor: 0,
    });
    await this.procedimentoRepo.salvar(criado);
    return criado.id;
  }
}
