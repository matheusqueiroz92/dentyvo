import type { ProfissionalRepositoryPort } from "@/core/auth/application/ports/ProfissionalRepositoryPort";
import type { Profissional } from "@/core/auth/domain/Profissional";
import type { AuditoriaLogPort } from "@/core/prontuario/application/ports/AuditoriaLogPort";

import type { UsuarioPlataformaRepositoryPort } from "../ports/UsuarioPlataformaRepositoryPort";
import { CasoDeUsoNaoImplementadoError } from "./nao-implementado";

export type ListarUsuariosDaClinicaInput = {
  solicitadoPorUsuarioPlataformaId: string;
  clinicaId: string;
};

/**
 * Lista profissionais/usuários de qualquer clínica (spec 009).
 */
export class ListarUsuariosDaClinica {
  constructor(
    private readonly profissionalRepo: ProfissionalRepositoryPort,
    private readonly usuarioPlataformaRepo: UsuarioPlataformaRepositoryPort,
    private readonly auditoria: AuditoriaLogPort,
  ) {}

  async executar(
    input: ListarUsuariosDaClinicaInput,
  ): Promise<Profissional[]> {
    void this.profissionalRepo;
    void this.usuarioPlataformaRepo;
    void this.auditoria;
    void input;
    throw new CasoDeUsoNaoImplementadoError("ListarUsuariosDaClinica");
  }
}
