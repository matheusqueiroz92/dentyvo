import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { VerificarAcessoAtivo } from "@/core/assinatura/application/use-cases/VerificarAcessoAtivo";

import type { ContextoAgendamentoPublico } from "../../domain/ContextoAgendamentoPublico";
import type { HorarioDisponivel } from "../../domain/DisponibilidadeProfissional";
import {
  AcessoClinicaInativoParaLinkPublicoError,
  ProfissionalNaoEncontradoPorSlugError,
} from "../../domain/errors";
import { ListarHorariosDisponiveisCore } from "./listarHorariosDisponiveisCore";

export type ListarHorariosDisponiveisNoLinkPublicoInput = {
  contexto: ContextoAgendamentoPublico;
  profissionalId: string;
  data: Date;
};

/**
 * Porta pública: valida acesso ativo e delega ao
 * {@link ListarHorariosDisponiveisCore}.
 */
export class ListarHorariosDisponiveisNoLinkPublico {
  constructor(
    private readonly core: ListarHorariosDisponiveisCore,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly verificarAcessoAtivo: VerificarAcessoAtivo,
  ) {}

  async executar(
    input: ListarHorariosDisponiveisNoLinkPublicoInput,
  ): Promise<HorarioDisponivel[]> {
    await this.assertAcessoAtivo(input.contexto.clinicaId);
    await this.assertProfissionalDoContexto(
      input.contexto,
      input.profissionalId,
    );

    return this.core.executar({
      clinicaId: input.contexto.clinicaId,
      profissionalId: input.profissionalId,
      data: input.data,
    });
  }

  private async assertAcessoAtivo(clinicaId: string): Promise<void> {
    const acesso = await this.verificarAcessoAtivo.executar({ clinicaId });
    if (!acesso.permitido) {
      throw new AcessoClinicaInativoParaLinkPublicoError(clinicaId);
    }
  }

  private async assertProfissionalDoContexto(
    contexto: ContextoAgendamentoPublico,
    profissionalId: string,
  ): Promise<void> {
    if (!contexto.profissionalSlug) {
      return;
    }

    const profissional = await this.profissionalRepo.buscarPorSlug(
      contexto.clinicaId,
      contexto.profissionalSlug,
    );
    if (!profissional || profissional.id !== profissionalId) {
      throw new ProfissionalNaoEncontradoPorSlugError(
        contexto.clinicaId,
        contexto.profissionalSlug,
      );
    }
  }
}
