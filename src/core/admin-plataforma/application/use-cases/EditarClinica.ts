import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { Clinica } from "@/core/auth/domain/Clinica";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import { ClinicaNaoEncontradaError } from "../../domain/errors";
import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import {
  autorizar,
  obterSolicitantePlataforma,
  registrarAuditoriaPlataforma,
} from "./helpers";

export type EditarClinicaInput = {
  solicitadoPorUsuarioPlataformaId: string;
  clinicaId: string;
  nome: string;
  endereco: string;
};

/**
 * Atualiza dados cadastrais de qualquer clínica (spec 009).
 */
export class EditarClinica {
  constructor(
    private readonly clinicaRepo: ClinicaRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(input: EditarClinicaInput): Promise<Clinica> {
    const solicitante = await obterSolicitantePlataforma(
      this.usuarioPlataformaRepo,
      input.solicitadoPorUsuarioPlataformaId,
    );
    autorizar(solicitante, "editar_clinica");

    const clinica = await this.clinicaRepo.buscarPorId(input.clinicaId);
    if (!clinica) {
      throw new ClinicaNaoEncontradaError(input.clinicaId);
    }

    const atualizada = clinica.atualizarDadosCadastrais({
      nome: input.nome,
      endereco: input.endereco,
    });
    const persistida = await this.clinicaRepo.atualizarParcial({
      id: input.clinicaId,
      nome: atualizada.nome,
      endereco: atualizada.endereco,
    });
    if (!persistida) {
      throw new ClinicaNaoEncontradaError(input.clinicaId);
    }

    await registrarAuditoriaPlataforma({
      auditoria: this.auditoria,
      solicitante,
      clinicaId: persistida.id,
      acao: "escrita",
      recursoTipo: "clinica",
      recursoId: persistida.id,
    });

    return persistida;
  }
}
