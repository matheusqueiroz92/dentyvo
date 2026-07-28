import type {
  ClinicaRepositoryPort,
  FiltrosListagemClinicas,
} from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { Clinica } from "@/core/auth/domain/Clinica";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import {
  autorizar,
  obterSolicitantePlataforma,
  registrarAuditoriaPlataforma,
} from "./helpers";

export type ListarClinicasInput = {
  solicitadoPorUsuarioPlataformaId: string;
  filtros?: FiltrosListagemClinicas;
};

/**
 * Lista clínicas cross-tenant (spec 009).
 * Registra auditoria de leitura (recurso `clinica`).
 */
export class ListarClinicas {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: ListarClinicasInput): Promise<Clinica[]> {
    const solicitante = await obterSolicitantePlataforma(
      this.usuarioPlataformaRepo,
      input.solicitadoPorUsuarioPlataformaId,
    );
    autorizar(solicitante, "listar_clinicas");

    const clinicas = await this.clinicaRepo.listar(input.filtros);

    await registrarAuditoriaPlataforma({
      auditoria: this.auditoria,
      solicitante,
      clinicaId: null,
      acao: "leitura",
      recursoTipo: "clinica",
      recursoId: "listagem",
    });

    return clinicas;
  }
}
