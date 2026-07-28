import type { AuthPort } from "@/core/auth/application/ports/AuthPort";
import type { ClinicaRepositoryPort } from "@/core/auth/application/ports/ClinicaRepositoryPort";
import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import { CasoDeUsoNaoImplementadoError } from "./nao-implementado";

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
    void this.clinicaRepo;
    void this.profissionalRepo;
    void this.usuarioPlataformaRepo;
    void this.auth;
    void this.auditoria;
    void input;
    throw new CasoDeUsoNaoImplementadoError("DesativarClinica");
  }
}
