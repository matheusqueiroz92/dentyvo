import type { AuthPort } from "@/core/auth/application/ports/AuthPort";
import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";
import { DadosInvalidosError } from "@/core/shared/errors";

import { ClinicaNaoEncontradaError } from "../../domain/errors";
import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import {
  autorizar,
  obterSolicitantePlataforma,
  registrarAuditoriaPlataforma,
} from "./helpers";

export type DesativarClinicaInput = {
  solicitadoPorUsuarioPlataformaId: string;
  clinicaId: string;
  /** Motivo obrigatório — vai para auditoria; não apaga prontuário. */
  motivo: string;
};

/**
 * Soft-delete de clínica (spec 009): status `inativa`, revoga sessões dos
 * membros, preserva prontuário/dado clínico.
 */
export class DesativarClinica {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auth: AuthPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: DesativarClinicaInput): Promise<void> {
    const solicitante = await obterSolicitantePlataforma(
      this.usuarioPlataformaRepo,
      input.solicitadoPorUsuarioPlataformaId,
    );
    autorizar(solicitante, "desativar_clinica");

    const motivo = input.motivo.trim();
    if (!motivo) {
      throw new DadosInvalidosError("Motivo da desativação é obrigatório.");
    }

    const clinica = await this.clinicaRepo.buscarPorId(input.clinicaId);
    if (!clinica) {
      throw new ClinicaNaoEncontradaError(input.clinicaId);
    }

    const inativa = clinica.desativar();
    await this.clinicaRepo.salvar(inativa);

    const membros = await this.profissionalRepo.listarPorClinica(input.clinicaId);
    for (const membro of membros) {
      await this.auth.revogarSessoesDoUsuario(membro.usuarioId);
    }

    await registrarAuditoriaPlataforma({
      auditoria: this.auditoria,
      solicitante,
      clinicaId: input.clinicaId,
      acao: "escrita",
      recursoTipo: "clinica",
      recursoId: input.clinicaId,
      detalhe: { motivo },
    });
  }
}
