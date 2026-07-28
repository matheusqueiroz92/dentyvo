import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { Clinica } from "@/core/auth/domain/Clinica";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import { CasoDeUsoNaoImplementadoError } from "./nao-implementado";

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
    void this.clinicaRepo;
    void this.usuarioPlataformaRepo;
    void this.auditoria;
    void input;
    throw new CasoDeUsoNaoImplementadoError("EditarClinica");
  }
}
