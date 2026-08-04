import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";

import { MenuPublicoProcedimento } from "../../domain/MenuPublicoProcedimento";
import type { ItemMenuPublicoProcedimento } from "../../domain/MenuPublicoProcedimento";
import { ProcedimentoNaoEncontradoError } from "../../domain/errors";
import type { MenuPublicoProcedimentoRepositoryPort } from "../ports/MenuPublicoProcedimentoRepositoryPort";
import type { ProcedimentoRepositoryPort } from "../ports/ProcedimentoRepositoryPort";
import { autorizar, obterSolicitanteNaClinica } from "./helpers";

export type ConfigurarMenuPublicoDeProcedimentosInput = {
  clinicaId: string;
  solicitadoPorUsuarioId: string;
  /** 2–4 itens; cada procedimentoId deve existir no tenant. */
  itens: ItemMenuPublicoProcedimento[];
};

/**
 * Configura o menu público curto (RBAC: admin).
 */
export class ConfigurarMenuPublicoDeProcedimentos {
  constructor(
    private readonly menuRepo: MenuPublicoProcedimentoRepositoryPort,
    private readonly procedimentoRepo: ProcedimentoRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
  ) {}

  async executar(
    input: ConfigurarMenuPublicoDeProcedimentosInput,
  ): Promise<void> {
    const solicitante = await obterSolicitanteNaClinica(
      this.profissionalRepo,
      input.solicitadoPorUsuarioId,
      input.clinicaId,
    );
    autorizar(solicitante, "configurar_menu_publico_procedimentos");

    for (const item of input.itens) {
      const procedimento = await this.procedimentoRepo.buscarPorId(
        input.clinicaId,
        item.procedimentoId,
      );
      if (!procedimento) {
        throw new ProcedimentoNaoEncontradoError(item.procedimentoId);
      }
    }

    const menu = MenuPublicoProcedimento.configurar(
      input.clinicaId,
      input.itens,
    );
    await this.menuRepo.salvar(menu);
  }
}
